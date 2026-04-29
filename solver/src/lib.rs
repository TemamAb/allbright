pub mod benchmarks;

pub use benchmarks::load_benchmarks;

pub const GES_WEIGHTS: [f64; 6] = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10];

#[test]
fn test_ges_weights_sum_to_one() {
    assert!((GES_WEIGHTS.iter().sum::<f64>() - 1.0).abs() < 0.001);
}