// use serde::{Serialize, Deserialize};
// use chrono::{DateTime, Utc};

// pub type HexColor = String;

// #[derive(Serialize, Deserialize, Clone)]
// pub struct Tag {
//     pub label: String,
//     pub color: HexColor,
// }

// #[derive(Serialize, Deserialize, Clone)]
// pub enum Priority {
//     Low,
//     Medium,
//     High,
// }

// #[derive(Serialize, Deserialize, Clone)]
// pub struct Task {
//     pub header: String,
//     pub id: String,
//     pub is_draft: bool,
//     pub created_at: DateTime<Utc>,
//     pub due_date: Option<DateTime<Utc>>,
//     pub completed_at: Option<DateTime<Utc>>,
//     pub priority: Option<Priority>,
//     pub content: Option<String>,
//     pub tags: Option<Vec<Tag>>,
//     pub folder: String,
// }

// #[derive(Serialize, Deserialize, Clone)]
// pub struct TaskList {
//     pub id: String,
//     pub header: String,
//     pub tasks: Vec<Task>,
// }
