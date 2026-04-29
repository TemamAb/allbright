use tokio::net::TcpListener;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("BrightSky Solver - Initializing Subsystems...");
    
    // Get port from environment or default to 4003 as per render.yaml
    let port = env::var("INTERNAL_BRIDGE_PORT").unwrap_or_else(|_| "4003".to_string());
    let addr = format!("0.0.0.0:{}", port);
    
    let listener = TcpListener::bind(&addr).await?;
    println!("BrightSky Solver - Listening on {}", addr);
    println!("BrightSky Solver - Deployment Ready [TCP HEALTHCHECK ACTIVE]");

    loop {
        let (socket, _) = listener.accept().await?;
        // Minimal handler to keep connections alive for health checks
        tokio::spawn(async move {
            let _ = socket.readable().await;
            // Connection will close when dropped, satisfying the TCP health check
        });
    }
}
