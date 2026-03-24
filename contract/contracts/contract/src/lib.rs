#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Symbol, Address};

#[contract]
pub struct TokenBridge;

#[contractimpl]
impl TokenBridge {

    // Store a deposit
    pub fn deposit(env: Env, user: Address, amount: i128) {
        let key = Symbol::new(&env, "BALANCE");
        let current: i128 = env.storage().instance().get(&key).unwrap_or(0);
        let new_balance = current + amount;
        env.storage().instance().set(&key, &new_balance);

        user.require_auth();
    }

    // Withdraw tokens
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        let key = Symbol::new(&env, "BALANCE");
        let current: i128 = env.storage().instance().get(&key).unwrap_or(0);

        if current < amount {
            panic!("Insufficient balance");
        }

        let new_balance = current - amount;
        env.storage().instance().set(&key, &new_balance);

        user.require_auth();
    }

    // Check balance
    pub fn get_balance(env: Env) -> i128 {
        let key = Symbol::new(&env, "BALANCE");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}