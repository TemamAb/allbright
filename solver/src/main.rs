use tokio::net::TcpListener;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let startup_time = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    println!("==================================================");
    println!("BRIGHTSKY SOLVER V2 - STARTING UP");
    println!("TIMESTAMP: {}", startup_time);
    println!("==================================================");
    
    // Get port from environment or default to 4003 as per render.yaml
    let port = env::var("INTERNAL_BRIDGE_PORT").unwrap_or_else(|_| "4003".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    println!("Attempting to bind to {}...", addr);
    let listener = TcpListener::bind(&addr).await?;
    println!("SUCCESS: Listening on {}", addr);
    println!("BrightSky Solver - LIVE [TCP HEALTHCHECK ACTIVE]");

    loop {
        let (socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            let _ = socket.readable().await;
        });
    }
}
