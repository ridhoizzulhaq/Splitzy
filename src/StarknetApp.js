import React, { useState, useEffect } from 'react';
import { Account, RpcProvider, Contract } from "starknet";
import axios from 'axios';
import Tesseract from 'tesseract.js';
import BigNumber from 'bignumber.js';
import compiledContractAbi from "./abi.json";

const provider = new RpcProvider({
  nodeUrl: "https://free-rpc.nethermind.io/sepolia-juno",
});

const accountAddress = '0x06f958c52D31acF7Ce692AC2749A1593902a2b5cFbFf13cDeCDe97ee4a12aC6f';
const privateKey = process.env.REACT_APP_PRIVATE_KEY;
const account = new Account(provider, accountAddress, privateKey, "1");

const contractAddress = '0x0520cbef7d51fa88f69e5803a15fa1d313644dd3707d698c448343034b8b26e7';

function StarknetApp() {
  const [storageContract, setStorageContract] = useState(null);
  const [billImage, setBillImage] = useState(null);
  const [billImageUrl, setBillImageUrl] = useState('');
  const [usdValue, setUsdValue] = useState('');
  const [ethValue, setEthValue] = useState('');
  const [weiValue, setWeiValue] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(accountAddress);

  useEffect(() => {
    async function initializeContract() {
      try {
        const contract = new Contract(compiledContractAbi, contractAddress, provider);
        setStorageContract(contract);
      } catch (error) {
        console.error("Error initializing contract:", error);
      }
    }
    initializeContract();
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setBillImage(file);
    setBillImageUrl(URL.createObjectURL(file)); // Display the uploaded image
  };

  const extractTotalFromImage = async (imageFile) => {
    try {
        const result = await Tesseract.recognize(
            imageFile,
            'eng',
            {
                logger: (m) => console.log(m),
            }
        );

        const extractedText = result.data.text;
        console.log("Extracted Text:", extractedText);

        const text = extractedText.toLowerCase();
        
        const totalPattern = /(total|grand total|amount|jumlah|subtotal)\s*[:\-]?\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i;
        const matches = text.match(totalPattern);

        if (matches) {
            const usdAmount = parseFloat(matches[2].replace(',', ''));
            console.log("Extracted USD Amount:", usdAmount);
            setUsdValue(usdAmount);
            const ethValue = await convertUsdToEth(usdAmount);
            return ethValue;
        } else {
            alert("Total amount not found in the bill.");
            return null;
        }
    } catch (error) {
        console.error("Error extracting text:", error);
        return null;
    }
  };

  const convertUsdToEth = async (usdAmount) => {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const ethPrice = response.data.ethereum.usd;
      const ethAmount = usdAmount / ethPrice;
      const weiAmount = new BigNumber(ethAmount).multipliedBy(new BigNumber('1e18')).toFixed(0);
      setEthValue(ethAmount);
      setWeiValue(weiAmount);
      return ethAmount;
    } catch (error) {
      console.error("Failed to fetch ETH price:", error);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!storageContract || !billImage) return;

    try {
      setLoading(true);
      setTransactionHash('');

      const ethValue = await extractTotalFromImage(billImageUrl);
      if (!ethValue) {
        setLoading(false);
        return;
      }

      const ethValueInWei = new BigNumber(ethValue).multipliedBy(new BigNumber('1e18')).toFixed(0);
      const ethValueString = ethValueInWei.toString();

      storageContract.connect(account);

      const res = await account.execute({
        contractAddress: contractAddress,
        entrypoint: "set",
        calldata: [ethValueString]
      });

      await provider.waitForTransaction(res.transaction_hash);
      setTransactionHash(res.transaction_hash);
    } catch (error) {
      console.error("Error writing data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <div className="jumbotron text-center my-4">
          <h1 className="display-4 font-weight-bold">Splitzy</h1>
          <p className="lead">
          The ultimate Web3 AI-powered solution for splitting bills. Seamlessly convert your total from USD to ETH and split it with friends using Splitzy. Supported by Starknet
          </p>
        </div>
      </header>
      <main>
        <div className="row justify-content-center mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-body">
                <form onSubmit={handleSubmit} className="text-center">
                  <div className="form-group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="form-control-file mb-3"
                    />
                    {billImageUrl && (
                      <div className="mb-3">
                        <img src={billImageUrl} alt="Uploaded Bill" className="img-thumbnail" style={{ maxWidth: '100%' }} />
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading || !billImage}>
                      {loading ? "Processing..." : "Upload and Submit"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card text-center p-3 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Amount Details</h5>
                <p><strong>USD Amount:</strong> {usdValue ? `$${usdValue.toFixed(2)}` : 'N/A'}</p>
                <p><strong>ETH Amount:</strong> {ethValue ? `${ethValue.toFixed(6)} ETH` : 'N/A'}</p>
                <p><strong>Wei Amount:</strong> {weiValue ? `${weiValue} Wei` : 'N/A'}</p>
                {transactionHash && (
                  <p className="mt-3"><strong>Transaction Hash:</strong> {transactionHash}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StarknetApp;

