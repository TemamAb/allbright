use criterion::{black_box, criterion_group, criterion_main, Criterion};
use solver::path_cache::{PathCache, ArbitrageOpportunity, WatchtowerStats};
use std::sync::Arc;

fn bench_path_cache_put(c: &mut Criterion) {
    let stats = Arc::new(WatchtowerStats::default());
    let cache = PathCache::new(1000, Arc::clone(&stats));
    let opp = ArbitrageOpportunity {
        path: vec![0,1,2,0],
        log_weight: -0.1,
    };
    
    c.bench_function("path_cache_put", |b| b.iter(|| {
        cache.put(black_box(opp.clone()));
    }));
}

fn bench_path_cache_get_hit(c: &mut Criterion) {
    let stats = Arc::new(WatchtowerStats::default());
    let cache = PathCache::new(1000, Arc::clone(&stats));
    let opp = ArbitrageOpportunity {
        path: vec![0,1,2,0],
        log_weight: -0.1,
    };
    cache.put(opp.clone()); // Prime for hit
    
    c.bench_function("path_cache_get_hit", |b| b.iter(|| {
        let _ = cache.get(&black_box(vec![0,1,2,0]));
    }));
}

criterion_group!(benches, bench_path_cache_put, bench_path_cache_get_hit);
criterion_main!(benches);

