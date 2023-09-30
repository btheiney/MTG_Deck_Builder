const Pool = require("pg").Pool;
const jwt = require("jsonwebtoken");

// bcrypt password hashing.
const bcrypt = require("bcrypt");
const salt = bcrypt.genSaltSync(10);

const ACCESS_TOKEN_SECRET = 'Sq94mB%JK3tguq@e3J!Atyca6@fs&fVR';

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "deck_builder",
  password: "k3R7zE08VXidZr4b6L", // change the password to postgres
  port: 5432,
});

pool.query(
  'CREATE TABLE IF NOT EXISTS "members" ( "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL, "username" varchar NOT NULL, "password" varchar NOT NULL, "date_registered" integer NOT NULL );'
);

pool.query(
  'CREATE TABLE IF NOT EXISTS "decks" ( "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL, "created_by" integer NOT NULL, "deck_name" varchar NOT NULL, "date_created" integer NOT NULL );'
);

pool.query(
  'CREATE TABLE IF NOT EXISTS  "cards" ( "id" INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY NOT NULL, "deck_id" integer NOT NULL, "api_card_id" varchar NOT NULL, "card_name" varchar NOT NULL, "artwork_url" varchar NOT NULL );'
);

pool.query(
  'ALTER TABLE IF EXISTS "decks" ADD FOREIGN KEY ("created_by") REFERENCES "members" ("id");'
);

pool.query(
  'ALTER TABLE IF EXISTS "cards" ADD FOREIGN KEY ("deck_id") REFERENCES "decks" ("id") ON DELETE CASCADE;'
);

pool.query('ALTER TABLE IF EXISTS "members" ADD UNIQUE ("username");');

pool.query('ALTER TABLE "decks" ADD COLUMN IF NOT EXISTS "views" integer NOT NULL DEFAULT 0;');

// TOKEN FUNCTIONS

const authenticateToken = async (request, response, next) => {
  const authHeader = request.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return response.status(401).json({ success: false, error: 'Not logged in.' });
  }

  jwt.verify(token, ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return response.status(403).json({ success: false, error: 'An error has occurred ' + error });
    }

    request.member_id = decoded.member_id;
    request.username = decoded.username;
    next();
  });
};

// MEMBER FUNCTIONS

const logged_in = async (request, response) => {
  const authHeader = request.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log(token)
  if (token === null) return response.status(401).json({ loggedIn: false });
  jwt.verify(token, ACCESS_TOKEN_SECRET, (error, user) => {
    if (error) return response.status(403).json({ loggedIn: false });
    return response.json({ loggedIn: true });
  });
};

const getMembers = async (request, response) => {
  try {
    const results = await pool.query(
      "SELECT id, username, date_registered FROM members ORDER BY id ASC"
    );

    if (results.rows.length === 0) {
      return response.json({ error: "No members available to display." });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getMemberByID = async (request, response) => {
  try {
    const memberID = parseInt(request.params.member_id);
    // Verify that a valid deck ID was supplied.
    if (isNaN(memberID)) {
      return response.status(400).json({
        error: "Deck IDs must be a valid number.",
      });
    }

    const results = await pool.query(
      "SELECT id, username, date_registered FROM members where id = $1",
      [memberID]
    );

    if (results.rows.length === 0) {
      return response.json({ error: `Member not found.` });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const registerUser = async (request, response) => {
  let { username, password, confirm_password } = request.body;

  username = username.toLowerCase();
  const passwordHash = bcrypt.hashSync(password, 10);

  try {
    // check if already username exists in database.
    const usernameExists = await pool.query(
      "SELECT COUNT(*) FROM members WHERE username = $1",
      [username]
    );

    if (!username || username.length === 0 || !/^[a-zA-Z0-9]{3,23}$/.test(username)) {
      return response.json({
        success: false,
        error: "Usernames may only contain letters or numbers.",
      });
    }

    if (usernameExists.rows[0].count > 0) {
      return response.json({
        success: false,
        error: "Username is already taken.",
      });
    }

    // check if password and confirm_password match.
    if (password !== confirm_password) {
      return response
        .status(400)
        .json({ success: false, error: "Passwords do not match." });
    }

    // insert new user into database.
    const dateRegistered = Math.floor(Date.now() / 1000);
    await pool.query(
      "INSERT INTO members (username, password, date_registered) VALUES ($1, $2, $3)",
      [username.toLowerCase(), passwordHash, dateRegistered]
    );
    response.status(200).json({
      success: true,
      message: `${username.toLowerCase()} has been registered. You may now login!`,
    });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

const authenticateUser = async (request, response) => {
  let { username, password } = request.body;

  username = username.toLowerCase();

  try {
    // check if the username exists and the password is correct
    const result = await pool.query(
      "SELECT id, password FROM members WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0 ||  !bcrypt.compareSync(password, result.rows[0].password)) {
      return response.json({ success: false, error: "Incorrect Password." });
    }

    const accessToken = jwt.sign({ member_id: result.rows[0].id, username: username}, ACCESS_TOKEN_SECRET, { expiresIn: '12000000s'});
    response.json({ success: true, access_token: accessToken });

  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
};

// DECK FUNCTIONS

const getDecks = async (request, response) => {
  try {
    const results = await pool.query("SELECT * FROM decks ORDER BY id ASC");

    if (results.rows.length === 0) {
      return response.json({ error: "No decks available to display." });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getDeckByID = async (request, response) => {
  try {
    const deckID = parseInt(request.params.deck_id);
    console.log(request.params.deck_id)

    // Verify that a valid deck ID was supplied.
    if (isNaN(deckID)) {
      return response.status(400).json({
        error: "Deck IDs must be a valid number.",
      });
    }

    // Check if deck exists in database.
    const results = await pool.query("SELECT * FROM decks where id = $1", [
      deckID,
    ]);

    if (results.rows.length === 0) {
      return response.json({ error: `No decks available with id ${deckID}.` });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const getDecksByMemberID = async (request, response) => {
  try {

    const memberID = parseInt(request.params.memberid);

    // Verify that a valid member ID was supplied.
    if (isNaN(memberID)) {
      return response.status(400).json({
        error: "Member IDs must be a valid number.",
      });
    }

    const results = await pool.query(
      "SELECT * FROM decks where created_by = $1",
      [memberID]
    );

    // No decks found from that member.
    if (results.rows.length === 0) {
      return response.json({
        error: `No decks available from member ${memberID}.`,
      });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const createDeck = async (request, response) => {
  const { deck_name } = request.body;

  try {
    // Insert deck into database.
    const dateCreated = Math.floor(Date.now() / 1000);
    const result = await pool.query(
      "INSERT INTO decks (created_by, deck_name, date_created, views) VALUES ($1, $2, $3, $4)",
      [request.member_id, deck_name, dateCreated, 0]
    );
    response
      .status(200)
      .json({ success: true, message: `Deck: ${deck_name} has been created.` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteDeck = async (request, response) => {
  try {
    const deckID = parseInt(request.params.deck_id);

    // Verify that a valid deck ID was supplied.
    if (isNaN(deckID)) {
      return response.status(400).json({
        error: "Deck IDs must be a valid number.",
      });
    }

    // Check if the deck exists in database and member_id owns that deck.
    const createdBy = await pool.query(
      "SELECT created_by FROM decks WHERE id = $1",
      [deckID]
    );

    if (
      createdBy.rows.length === 0 ||
      createdBy.rows[0].created_by !== request.member_id
    ) {
      return response.json({
        success: false,
        error: "You do not own this deck.",
      });
    }

    const result = await pool.query("DELETE FROM decks WHERE id = $1", [
      deckID,
    ]);
    response
      .status(200)
      .json({ success: true, message: `Deck has been deleted.` });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

// CARD FUNCTIONS

const getCardsByDeckID = async (request, response) => {
  try {

    const deckID = parseInt(request.params.deck_id);

    // Verify that a valid deck ID was supplied.
    if (isNaN(deckID)) {
      return response.status(400).json({
        error: "Deck IDs must be a valid number.",
      });
    }

    const results = await pool.query("SELECT * FROM cards where deck_id = $1", [
      deckID,
    ]);


    try {
      // increment deck's view count by 1.
      const query = await pool.query(
        "UPDATE decks SET views = views + 1 WHERE id = $1",
        [deckID]
      );
    } catch (error) {
      console.error(error);
      response.status(500).json({ error: "Internal Server Error" });
    }

    // Deck does not contain any cards or deck does not exist.
    if (results.rows.length === 0) {
      return response.json({
        success: false,
        error: "No cards found or deck does not exist.",
      });
    }

    response.status(200).json(results.rows);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const addCardToDeck = async (request, response) => {
  const deckID = parseInt(request.params.deck_id);
  const { api_card_id, card_name, artwork_url } = request.body;

  try {
    // Check if the deck exists in database and member_id owns that deck.
    const createdBy = await pool.query(
      "SELECT created_by FROM decks WHERE id = $1",
      [deckID]
    );

    if (
      createdBy.rows.length === 0 ||
      createdBy.rows[0].created_by !== request.member_id
    ) {
      return response.json({
        success: false,
        error: "You do not own this deck.",
      });
    }

    // Insert the card into the deck.
    const insert = await pool.query(
      "INSERT INTO cards (deck_id, api_card_id, card_name, artwork_url) VALUES ($1, $2, $3, $4)",
      [deckID, api_card_id, card_name, artwork_url]
    );
    response.status(200).json({
      success: true,
      message: card_name + " added to the deck successfully.",
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCardFromDeck = async (request, response) => {
  const deckID = parseInt(request.params.deck_id);
  const cardID = parseInt(request.params.card_id);

  try {
    // Check if the deck exists in database and member_id owns that deck.
    const createdBy = await pool.query(
      "SELECT created_by FROM decks WHERE id = $1",
      [deckID]
    );

    if (
      createdBy.rows.length === 0 ||
      createdBy.rows[0].created_by !== request.member_id
    ) {
      return response.json({
        success: false,
        error: "You do not own this deck.",
      });
    }

    // Check if deck contains card.
    const numCardsInDeck = await pool.query(
      "SELECT COUNT(*) FROM cards WHERE deck_id = $1 AND id = $2",
      [deckID, cardID]
    );

    if (createdBy.rows.length === 0 || numCardsInDeck.rows[0].count < 1) {
      return response.json({
        success: false,
        error: "Card could not be found in this deck",
      });
    }

    // delete the card from the deck.
    const deleteCard = await pool.query(
      "DELETE FROM cards where id = $1 AND deck_id = $2",
      [cardID, deckID]
    );
    response.status(200).json({
      success: true,
      message: "Card has been removed from deck successfully.",
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  logged_in,
  getMembers,
  getMemberByID,
  registerUser,
  authenticateUser,
  getDecks,
  getDeckByID,
  getDecksByMemberID,
  getCardsByDeckID,
  createDeck,
  addCardToDeck,
  deleteDeck,
  deleteCardFromDeck,
  authenticateToken
};
