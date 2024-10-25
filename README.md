# Project Setup
## Please Build .env file                      
REACT_APP_PRIVATE_KEY="your account private key"

## Install Starknet.JS         
### npm install starknet@next

## Smart Contract (First Wave)


    #[starknet::interface]
    trait ISimpleStorage<T> {
        fn set(ref self: T, x: u128);
        fn get(self: @T) -> u128;
    }

    #[starknet::contract]
    mod SimpleStorage {
        use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

        #[storage]
        struct Storage {
            stored_data: u128
        }

        #[abi(embed_v0)]
        impl SimpleStorage of super::ISimpleStorage<ContractState> {
            fn set(ref self: ContractState, x: u128) {
                self.stored_data.write(x);
            }

            fn get(self: @ContractState) -> u128 {
                self.stored_data.read()
            }
        }
    }
    # 
    # 






# Running React App

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

