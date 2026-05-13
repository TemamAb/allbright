use crate::{strategy::Strategy, simulator};

pub struct Report {
    pub current_profit: f64,
    pub upgraded_profit: f64,
    pub delta: f64,
}

pub fn generate(current: &Strategy, upgraded: &Strategy) -> Report {
    let c = simulator::simulate(current);
    let u = simulator::simulate(upgraded);

    Report {
        current_profit: c,
        upgraded_profit: u,
        delta: u - c,
    }
}
