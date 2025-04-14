use mongodb::{
    bson::{doc, oid::ObjectId},
    options::ClientOptions,
    Client, Collection, Database,
};
use crate::models::user::User;
use crate::models::game_session::{GameSession, GameStatus};
use std::env;
use std::sync::{Arc, Mutex};
use log::info;
use bcrypt::{hash, DEFAULT_COST};
use std::collections::HashMap;

// In-memory storage for when MongoDB is not available
struct InMemoryStorage {
    users: HashMap<String, User>,
    games: HashMap<String, GameSession>,
    user_counter: i64,
    game_counter: i64,
}

#[derive(Clone)]
pub struct DbConnection {
    db: Option<Database>,
    in_memory: Option<Arc<Mutex<InMemoryStorage>>>,
}

impl DbConnection {
    pub fn new(db: Database) -> Self {
        Self { 
            db: Some(db),
            in_memory: None
        }
    }

    pub fn new_in_memory() -> Self {
        Self {
            db: None,
            in_memory: Some(Arc::new(Mutex::new(InMemoryStorage {
                users: HashMap::new(),
                games: HashMap::new(),
                user_counter: 0,
                game_counter: 0,
            })))
        }
    }

    pub fn users_collection(&self) -> Collection<User> {
        self.db.as_ref().unwrap().collection("users")
    }

    pub fn games_collection(&self) -> Collection<GameSession> {
        self.db.as_ref().unwrap().collection("games")
    }

    // User methods
    pub async fn find_user(&self, username: &str) -> Result<User, mongodb::error::Error> {
        if let Some(db) = &self.db {
            let collection = db.collection("users");
            match collection.find_one(doc! { "username": username }, None).await? {
                Some(user) => Ok(user),
                None => Err(mongodb::error::Error::custom("User not found"))
            }
        } else if let Some(in_memory) = &self.in_memory {
            let storage = in_memory.lock().unwrap();
            match storage.users.get(username) {
                Some(user) => Ok(user.clone()),
                None => Err(mongodb::error::Error::custom("User not found"))
            }
        } else {
            Err(mongodb::error::Error::custom("No database connection available"))
        }
    }

    pub async fn find_user_by_id(&self, id: &ObjectId) -> Result<User, mongodb::error::Error> {
        if let Some(db) = &self.db {
            let collection = db.collection("users");
            match collection.find_one(doc! { "_id": id }, None).await? {
                Some(user) => Ok(user),
                None => Err(mongodb::error::Error::custom("User not found"))
            }
        } else {
            // In-memory doesn't support finding by ID directly
            Err(mongodb::error::Error::custom("Operation not supported in memory-only mode"))
        }
    }

    pub async fn create_user(&self, mut user: User) -> Result<User, mongodb::error::Error> {
        if let Some(db) = &self.db {
            // Hash the password
            let hashed_password = bcrypt::hash(&user.password_hash, 4)
                .map_err(|e| mongodb::error::Error::custom(format!("Failed to hash password: {}", e)))?;
            user.password_hash = hashed_password;
            
            // Add ObjectId
            user.id = Some(ObjectId::new());
            
            // Insert into MongoDB
            let collection: Collection<User> = db.collection("users");
            collection.insert_one(&user, None).await?;
            
            Ok(user)
        } else if let Some(in_memory) = &self.in_memory {
            let mut storage = in_memory.lock().unwrap();
            
            if storage.users.contains_key(&user.username) {
                return Err(mongodb::error::Error::custom("Username already exists"));
            }
            
            storage.user_counter += 1;
            let id = ObjectId::new();
            user.id = Some(id);
            
            storage.users.insert(user.username.clone(), user.clone());
            Ok(user)
        } else {
            Err(mongodb::error::Error::custom("No database connection available"))
        }
    }

    pub async fn create_guest_user(&self) -> Result<User, mongodb::error::Error> {
        let uuid = uuid::Uuid::new_v4().to_string();
        let guest_name = format!("guest_{}", uuid.split('-').next().unwrap_or("user"));
        
        let guest_user = User {
            id: None,
            username: guest_name,
            password_hash: hash("guest", DEFAULT_COST).unwrap_or_else(|_| "invalid".to_string()),
            email: format!("{}@guest.rustic-knights.com", uuid),
            rating: 1000,
            is_guest: true,
        };
        
        self.create_user(guest_user).await
    }

    // Game methods
    pub async fn create_game(&self, game: GameSession) -> Result<String, mongodb::error::Error> {
        if let Some(db) = &self.db {
            let collection: Collection<GameSession> = db.collection("games");
            let result = collection.insert_one(&game, None).await?;
            
            // Get the _id from the result and convert to string
            let id = result.inserted_id.as_object_id()
                .ok_or_else(|| mongodb::error::Error::custom("Failed to get ObjectId from insert result"))?;
                
            Ok(id.to_hex())
        } else if let Some(in_memory) = &self.in_memory {
            let mut storage = in_memory.lock().unwrap();
            
            storage.game_counter += 1;
            let mut game_mut = game;
            let id = ObjectId::new();
            game_mut.id = Some(id.clone());
            let id_str = id.to_hex();
            
            storage.games.insert(id_str.clone(), game_mut);
            Ok(id_str)
        } else {
            Err(mongodb::error::Error::custom("No database connection available"))
        }
    }

    pub async fn join_game(&self, game_id: &str, player_id: String) -> Result<GameSession, mongodb::error::Error> {
        if let Some(db) = &self.db {
            // Convert string id to ObjectId
            let object_id = ObjectId::parse_str(game_id)
                .map_err(|e| mongodb::error::Error::custom(format!("Invalid game ID: {}", e)))?;
            
            // Find the game
            let collection: Collection<GameSession> = db.collection("games");
            let mut game: GameSession = match collection.find_one(doc! { "_id": object_id }, None).await? {
                Some(game) => game,
                None => return Err(mongodb::error::Error::custom("Game not found"))
            };
            
            // Update the game with the new player
            if game.black_player.is_none() {
                game.black_player = Some(player_id);
                game.status = GameStatus::InProgress;
                
                // Update in database - use strings for status to make it serializable
                let status_str = match game.status {
                    GameStatus::Waiting => "Waiting",
                    GameStatus::InProgress => "InProgress",
                    GameStatus::Completed => "Completed",
                };
                
                collection.update_one(
                    doc! { "_id": object_id },
                    doc! { "$set": { "black_player": &game.black_player, "status": status_str } },
                    None
                ).await?;
                
                Ok(game)
            } else {
                Err(mongodb::error::Error::custom("Game is already full"))
            }
        } else if let Some(in_memory) = &self.in_memory {
            let mut storage = in_memory.lock().unwrap();
            
            // Find the game
            let game = match storage.games.get_mut(game_id) {
                Some(game) => game,
                None => return Err(mongodb::error::Error::custom("Game not found"))
            };
            
            // Update the game with the new player
            if game.black_player.is_none() {
                game.black_player = Some(player_id);
                game.status = GameStatus::InProgress;
                Ok(game.clone())
            } else {
                Err(mongodb::error::Error::custom("Game is already full"))
            }
        } else {
            Err(mongodb::error::Error::custom("No database connection available"))
        }
    }
}

pub async fn connect() -> Result<DbConnection, mongodb::error::Error> {
    // Load environment variables from .env file
    dotenv::dotenv().ok();
    
    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "rustic_knights".to_string());
    
    info!("Connecting to MongoDB at: {}", mongodb_uri);
    
    let client_options = ClientOptions::parse(&mongodb_uri).await?;
    let client = Client::with_options(client_options)?;
    let db = client.database(&database_name);
    
    // Test the connection
    client.list_database_names(None, None).await?;
    info!("Successfully connected to MongoDB");
    
    Ok(DbConnection::new(db))
}

pub fn create_in_memory_db() -> DbConnection {
    info!("Creating in-memory database");
    DbConnection::new_in_memory()
}
