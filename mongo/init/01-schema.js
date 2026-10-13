db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || "feedme");

const hasCollection = (name) => db.getCollectionNames().includes(name);

const ensureCollection = (name, validator) => {
  if (!hasCollection(name)) {
    db.createCollection(name, {
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  } else {
    db.runCommand({
      collMod: name,
      validator,
      validationLevel: "strict",
      validationAction: "error",
    });
  }
};

ensureCollection("users", {
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "password_hash", "created_at", "updated_at", "is_active"],
    properties: {
      email: { bsonType: "string", minLength: 3, maxLength: 254 },
      password_hash: { bsonType: "string", minLength: 20 },
      display_name: { bsonType: "string", maxLength: 100 },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
      last_login_at: { bsonType: ["date", "null"] },
      is_active: { bsonType: "bool" },
    },
  },
});

ensureCollection("conversations", {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "messages", "created_at", "updated_at"],
    properties: {
      user_id: { bsonType: "objectId" },
      title: { bsonType: "string", maxLength: 200 },
      messages: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["role", "content", "created_at"],
          properties: {
            role: { enum: ["user", "assistant"] },
            content: { bsonType: "string", minLength: 1, maxLength: 10000 },
            created_at: { bsonType: "date" },
          },
        },
      },
      created_at: { bsonType: "date" },
      updated_at: { bsonType: "date" },
    },
  },
});

ensureCollection("searches", {
  $jsonSchema: {
    bsonType: "object",
    required: ["user_id", "criteria", "results", "provider", "created_at"],
    properties: {
      user_id: { bsonType: "objectId" },
      conversation_id: { bsonType: ["objectId", "null"] },
      criteria: {
        bsonType: "object",
        properties: {
          address: { bsonType: "string", maxLength: 500 },
          radius_km: { bsonType: ["double", "int"], minimum: 0, maximum: 100 },
          cuisine: { bsonType: "string", maxLength: 100 },
          budget: { bsonType: "int", minimum: 1, maximum: 4 },
          preferences: {
            bsonType: "array",
            items: { bsonType: "string", maxLength: 100 },
          },
          location: {
            bsonType: "object",
            required: ["type", "coordinates"],
            properties: {
              type: { enum: ["Point"] },
              coordinates: {
                bsonType: "array",
                minItems: 2,
                maxItems: 2,
                items: { bsonType: ["double", "int"] },
              },
            },
          },
        },
      },
      results: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["provider_id", "name"],
          properties: {
            provider_id: { bsonType: "string", maxLength: 500 },
            name: { bsonType: "string", maxLength: 300 },
            address: { bsonType: "string", maxLength: 500 },
            location: {
              bsonType: "object",
              properties: {
                type: { enum: ["Point"] },
                coordinates: { bsonType: "array", minItems: 2, maxItems: 2 },
              },
            },
            rating: { bsonType: ["double", "int", "null"], minimum: 0, maximum: 5 },
            price_level: { bsonType: ["int", "null"], minimum: 1, maximum: 4 },
            cuisine: { bsonType: "array", items: { bsonType: "string" } },
            url: { bsonType: ["string", "null"] },
            score: { bsonType: ["double", "int", "null"], minimum: 0, maximum: 1 },
          },
        },
      },
      provider: { bsonType: "string", enum: ["google_places", "openstreetmap"] },
      created_at: { bsonType: "date" },
    },
  },
});

db.users.createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });
db.conversations.createIndex({ user_id: 1, updated_at: -1 }, { name: "conversations_user_updated" });
db.searches.createIndex({ user_id: 1, created_at: -1 }, { name: "searches_user_created" });
db.searches.createIndex({ conversation_id: 1 }, { name: "searches_conversation" });
db.searches.createIndex({ "criteria.location": "2dsphere" }, { name: "searches_criteria_location" });

print("FeedMe MongoDB schema initialized");
