// BSS-28: Enhanced Meta-Learner with Reinforcement Learning
// Replaces simple EMA with Q-learning for better strategy adaptation

use crate::{WatchtowerStats, PolicyDelta};
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::Ordering;

/// Experience tuple for replay buffer
#[derive(Clone, Debug)]
struct Experience {
    state: String,
    action: String,
    reward: f64,
    next_state: String,
}

/// Action space for the reinforcement learner
#[derive(Clone, Copy, Debug, PartialEq)]
enum Action {
    MinProfitUp,
    MinProfitDown,
    MaxHopsUp,
    MaxHopsDown,
    NoChange,
}

impl Action {
    fn all() -> Vec<Self> {
        vec![
            Self::MinProfitUp,
            Self::MinProfitDown,
            Self::MaxHopsUp,
            Self::MaxHopsDown,
            Self::NoChange,
        ]
    }

    fn to_string(&self) -> &str {
        match self {
            Self::MinProfitUp => "min_profit_up",
            Self::MinProfitDown => "min_profit_down",
            Self::MaxHopsUp => "max_hops_up",
            Self::MaxHopsDown => "max_hops_down",
            Self::NoChange => "no_change",
        }
    }

    fn from_string(s: &str) -> Option<Self> {
        match s {
            "min_profit_up" => Some(Self::MinProfitUp),
            "min_profit_down" => Some(Self::MinProfitDown),
            "max_hops_up" => Some(Self::MaxHopsUp),
            "max_hops_down" => Some(Self::MaxHopsDown),
            "no_change" => Some(Self::NoChange),
            _ => None,
        }
    }
}

/// State discretization for Q-learning
#[derive(Clone, Debug)]
struct MarketState {
    success_rate_category: SuccessCategory,
    profit_momentum_category: MomentumCategory,
    trade_volume_category: VolumeCategory,
}

#[derive(Clone, Debug, PartialEq)]
enum SuccessCategory {
    Low,    // <70%
    Medium, // 70-90%
    High,   // >90%
}

#[derive(Clone, Debug, PartialEq)]
enum MomentumCategory {
    Negative, // < -0.1
    Neutral,  // -0.1 to 0.1
    Positive, // > 0.1
}

#[derive(Clone, Debug, PartialEq)]
enum VolumeCategory {
    Low,    // <10 trades
    Medium, // 10-50 trades
    High,   // >50 trades
}

/// BSS-28: Advanced Reinforcement Learning Meta-Learner
/// Uses Q-learning with experience replay for optimal trading strategy adaptation
pub struct ReinforcementMetaLearner {
    // Q-table: state -> action values
    q_table: HashMap<String, Vec<f64>>,

    // Experience replay buffer
    replay_buffer: VecDeque<Experience>,
    max_replay_size: usize,

    // Learning parameters
    learning_rate: f64,
    discount_factor: f64,
    exploration_rate: f64,

    // State tracking
    current_state: Option<String>,
    last_action: Option<String>,
    last_reward: f64,

    // Performance tracking
    episodes_completed: u64,
    total_reward: f64,
}

impl ReinforcementMetaLearner {
    pub fn new() -> Self {
        let mut learner = Self {
            q_table: HashMap::new(),
            replay_buffer: VecDeque::new(),
            max_replay_size: 10000, // Larger buffer for better learning
            learning_rate: 0.1,
            discount_factor: 0.95, // Slightly higher for longer-term thinking
            exploration_rate: 0.15, // Slightly more exploration
            current_state: None,
            last_action: None,
            last_reward: 0.0,
            episodes_completed: 0,
            total_reward: 0.0,
        };

        learner.initialize_q_table();
        learner
    }

    /// Initialize Q-table with all possible states and reasonable default values
    fn initialize_q_table(&mut self) {
        let states = self.generate_all_states();
        for state in states {
            // Initialize with small random values plus bias toward conservative actions
            let mut q_values = Vec::new();
            for action in Action::all() {
                let random_value = (fastrand::f64() - 0.5) * 0.1; // Use fastrand for speed
                let bias = match action {
                    Action::NoChange => 0.05,        // Slight preference for stability
                    Action::MinProfitDown => 0.02,   // Conservative profit reduction
                    Action::MaxHopsUp => 0.01,       // Slight preference for exploration
                    _ => 0.0,
                };
                q_values.push(random_value + bias);
            }
            self.q_table.insert(state, q_values);
        }
    }

    /// Generate all possible state combinations (3x3x3 = 27 states)
    fn generate_all_states(&self) -> Vec<String> {
        let success_categories = vec!["low", "medium", "high"];
        let momentum_categories = vec!["negative", "neutral", "positive"];
        let volume_categories = vec!["low", "medium", "high"];

        let mut states = Vec::new();
        for success in &success_categories {
            for momentum in &momentum_categories {
                for volume in &volume_categories {
                    states.push(format!("{}_{}_{}", success, momentum, volume));
                }
            }
        }
        states
    }

    /// Convert WatchtowerStats to discrete state for Q-learning
    fn stats_to_state(&self, stats: &WatchtowerStats) -> String {
        // Success rate categories
        let success_rate = stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
        let success_cat = if success_rate < 0.7 {
            "low"
        } else if success_rate < 0.9 {
            "medium"
        } else {
            "high"
        };

        // Profit momentum categories
        let momentum_bits = stats.meta_profit_momentum.load(Ordering::Relaxed);
        let momentum = f64::from_bits(momentum_bits);
        let momentum_cat = if momentum < -0.1 {
            "negative"
        } else if momentum < 0.1 {
            "neutral"
        } else {
            "positive"
        };

        // Trade volume categories (recent trades)
        let trade_count = stats.meta_trade_count.load(Ordering::Relaxed);
        let volume_cat = if trade_count < 10 {
            "low"
        } else if trade_count < 50 {
            "medium"
        } else {
            "high"
        };

        format!("{}_{}_{}", success_cat, momentum_cat, volume_cat)
    }

    /// Calculate reward based on recent performance and action taken
    fn calculate_reward(&self, stats: &WatchtowerStats, action: &Action) -> f64 {
        let mut reward = 0.0;

        // Base reward from profit momentum (scale to reasonable range)
        let momentum_bits = stats.meta_profit_momentum.load(Ordering::Relaxed);
        let momentum = f64::from_bits(momentum_bits);
        reward += momentum * 10.0;

        // Success rate contribution (reward above 80% success rate)
        let success_rate = stats.meta_success_ratio_ema.load(Ordering::Relaxed) as f64 / 10000.0;
        reward += (success_rate - 0.8) * 5.0;

        // Penalty for extreme actions (discourage wild parameter swings)
        match action {
            Action::MinProfitUp | Action::MinProfitDown |
            Action::MaxHopsUp | Action::MaxHopsDown => {
                reward -= 0.1; // Small penalty for making changes
            }
            Action::NoChange => {
                // Bonus for stability when performing well
                if success_rate > 0.85 && momentum > 0.05 {
                    reward += 0.5; // Reward maintaining good performance
                }
            }
        }

        reward
    }

    /// Choose action using epsilon-greedy policy
    fn choose_action(&self, state: &str) -> Action {
        // Exploration vs exploitation
        if fastrand::f64() < self.exploration_rate {
            // Exploration: random action
            let actions = Action::all();
            let index = fastrand::usize(0..actions.len());
            actions[index]
        } else {
            // Exploitation: best action from Q-table
            if let Some(q_values) = self.q_table.get(state) {
                let mut best_action_index = 0;
                let mut best_q_value = q_values[0];

                for (i, &q_value) in q_values.iter().enumerate() {
                    if q_value > best_q_value {
                        best_q_value = q_value;
                        best_action_index = i;
                    }
                }

                Action::all()[best_action_index]
            } else {
                // Fallback to random if state not found
                Action::NoChange
            }
        }
    }

    /// Update Q-value using Q-learning update rule
    fn update_q_value(&mut self, state: &str, action: &Action, reward: f64, next_state: &str) {
        let action_index = match action {
            Action::MinProfitUp => 0,
            Action::MinProfitDown => 1,
            Action::MaxHopsUp => 2,
            Action::MaxHopsDown => 3,
            Action::NoChange => 4,
        };

        let current_q = self.q_table.get(state)
            .and_then(|q_values| q_values.get(action_index))
            .copied()
            .unwrap_or(0.0);

        let max_next_q = self.q_table.get(next_state)
            .map(|q_values| q_values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)))
            .unwrap_or(0.0);

        // Q-learning update: Q(s,a) = Q(s,a) + α[r + γ*max(Q(s',a')) - Q(s,a)]
        let new_q = current_q + self.learning_rate * (reward + self.discount_factor * max_next_q - current_q);

        if let Some(q_values) = self.q_table.get_mut(state) {
            q_values[action_index] = new_q;
        }
    }

    /// Add experience to replay buffer
    fn add_to_replay_buffer(&mut self, experience: Experience) {
        self.replay_buffer.push_back(experience);

        // Maintain buffer size limit
        while self.replay_buffer.len() > self.max_replay_size {
            self.replay_buffer.pop_front();
        }
    }

    /// Sample and learn from replay buffer (experience replay)
    fn learn_from_replay(&mut self) {
        if self.replay_buffer.len() < 10 {
            return; // Need minimum experiences
        }

        // Sample random experiences for learning (mini-batch)
        let sample_size = std::cmp::min(32, self.replay_buffer.len());

        // Collect random indices without replacement
        let mut indices = Vec::new();
        while indices.len() < sample_size {
            let index = fastrand::usize(0..self.replay_buffer.len());
            if !indices.contains(&index) {
                indices.push(index);
            }
        }

        // Learn from each sampled experience
        for &index in &indices {
            if let Some(experience) = self.replay_buffer.get(index) {
                if let Ok(action) = Action::from_string(&experience.action) {
                    self.update_q_value(&experience.state, &action, experience.reward, &experience.next_state);
                }
            }
        }
    }

    /// Observe trade outcome and learn from it (core learning method)
    pub fn observe_trade(&mut self, stats: &WatchtowerStats, profit_eth: f64, success: bool) {
        let next_state = self.stats_to_state(stats);

        // Calculate reward based on previous action (if any)
        let reward = if let (Some(ref state), Some(ref action_str)) = (&self.current_state, &self.last_action) {
            if let Some(action) = Action::from_string(action_str) {
                self.calculate_reward(stats, &action)
            } else {
                0.0
            }
        } else {
            0.0
        };

        // Store experience in replay buffer if we have previous state/action
        if let (Some(ref state), Some(ref action_str)) = (&self.current_state, &self.last_action) {
            let experience = Experience {
                state: state.clone(),
                action: action_str.clone(),
                reward,
                next_state: next_state.clone(),
            };
            self.add_to_replay_buffer(experience);

            // Learn from this experience
            if let Some(action) = Action::from_string(action_str) {
                self.update_q_value(state, &action, reward, &next_state);
            }

            // Periodic learning from replay buffer (10% chance)
            if fastrand::f64() < 0.1 {
                self.learn_from_replay();
            }
        }

        // Update state for next observation
        self.current_state = Some(next_state);
        self.last_reward = reward;
        self.total_reward += reward;
    }

    /// Get policy recommendation using learned Q-values (main API method)
    pub fn get_policy_recommendation(&mut self, stats: &WatchtowerStats) -> PolicyDelta {
        let state = self.stats_to_state(stats);
        let action = self.choose_action(&state);

        // Store action for next learning iteration
        self.last_action = Some(action.to_string());

        let mut delta = PolicyDelta::default();

        // Convert action to policy delta with conservative step sizes
        match action {
            Action::MinProfitUp => {
                delta.min_profit_bps_delta = 2; // Small increase (0.02%)
            }
            Action::MinProfitDown => {
                delta.min_profit_bps_delta = -1; // Conservative decrease (0.01%)
            }
            Action::MaxHopsUp => {
                delta.max_hops_delta = 1; // Increase max hops
            }
            Action::MaxHopsDown => {
                delta.max_hops_delta = -1; // Decrease max hops
            }
            Action::NoChange => {
                // Keep current policy - no changes
            }
        }

        delta
    }

    /// Get learning statistics for monitoring and debugging
    pub fn get_learning_stats(&self) -> LearningStats {
        LearningStats {
            q_table_size: self.q_table.len(),
            replay_buffer_size: self.replay_buffer.len(),
            exploration_rate: self.exploration_rate,
            current_state: self.current_state.clone(),
            last_action: self.last_action.clone(),
            last_reward: self.last_reward,
            episodes_completed: self.episodes_completed,
            total_reward: self.total_reward,
        }
    }

    /// Reset learning state (useful for testing or when market conditions change significantly)
    pub fn reset(&mut self) {
        self.q_table.clear();
        self.replay_buffer.clear();
        self.initialize_q_table();
        self.current_state = None;
        self.last_action = None;
        self.last_reward = 0.0;
        self.episodes_completed = 0;
        self.total_reward = 0.0;
    }

    /// Manually trigger learning from replay buffer
    pub fn force_learning_from_replay(&mut self) {
        self.learn_from_replay();
    }
}

/// Statistics for monitoring the reinforcement learning system
#[derive(Debug, Clone)]
pub struct LearningStats {
    pub q_table_size: usize,
    pub replay_buffer_size: usize,
    pub exploration_rate: f64,
    pub current_state: Option<String>,
    pub last_action: Option<String>,
    pub last_reward: f64,
    pub episodes_completed: u64,
    pub total_reward: f64,
}

impl ReinforcementMetaLearner {
    /// Get learning statistics for monitoring and debugging
    pub fn get_learning_stats(&self) -> LearningStats {
        LearningStats {
            q_table_size: self.q_table.len(),
            replay_buffer_size: self.replay_buffer.len(),
            exploration_rate: self.exploration_rate,
            current_state: self.current_state.clone(),
            last_action: self.last_action.clone(),
            last_reward: self.last_reward,
            episodes_completed: self.episodes_completed,
            total_reward: self.total_reward,
        }
    }

    /// Reset learning state (useful for testing or when market conditions change significantly)
    pub fn reset(&mut self) {
        self.q_table.clear();
        self.replay_buffer.clear();
        self.initialize_q_table();
        self.current_state = None;
        self.last_action = None;
        self.last_reward = 0.0;
        self.episodes_completed = 0;
        self.total_reward = 0.0;
    }

    /// Manually trigger learning from replay buffer
    pub fn force_learning_from_replay(&mut self) {
        self.learn_from_replay();
    }
}

