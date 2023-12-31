import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useMatch } from "react-router-dom";
import { ICard } from "../Interfaces/ICard";
import "./Card.Page.css";
import PrivateFetch from "../../services/PrivateFetch";
import { useJwt } from "react-jwt";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Loader from "../Loader/Loader";

interface Props {
  card?: ICard;
}

interface IDeck {
  id: number;
  deck_name: string;
  created_by: number;
  date_created: number;
}

// interface card {
//   api_card_id: string;
//   card_name: string;
//   artwork_url: string;
// }

function CardPage({ card: defaultCard }: Props) {
  const match = useMatch("card/:id");
  const CARD_ID = match?.params.id;
  const token = localStorage.getItem("token");
  const { decodedToken, isExpired, reEvaluateToken } = useJwt<User>(
    localStorage.getItem("token") || ""
  );
  const [card, setCard] = useState<ICard>(defaultCard!);
  const [decksId, setDecksId] = useState<IDeck[]>([]);

  const [selectValue, setSelectValue] = useState<string>();

  useEffect(() => {
    const token = localStorage.getItem("token");
    reEvaluateToken(token || "");
    fetchCardHandler();
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  async function fetchCardHandler() {
    const res = await fetch(`https://api.scryfall.com/cards/${CARD_ID}`);
    const data = await res.json();
    const transformedCard: ICard = data;
    setCard(transformedCard);
    setIsLoading(false);
  }

  async function fetchUserDecks() {
    if (decodedToken) {
      console.log("decodedToken: " + decodedToken?.member_id);
      const res = await PrivateFetch(
        "GET",
        `/decks/member/${decodedToken?.member_id}`,
        null
      );
      setDecksId(res);
      return;
    }
  }

  async function AddToDeck() {
    if (selectValue) {
      const res = await PrivateFetch("POST", `decks/${selectValue}/add`, {
        api_card_id: card.id,
        card_name: card.name,
        artwork_url: card.image_uris.normal,
      });
      console.log(res);
      toast.success(`Card ${card.name} has been added successfully`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    toast.error(`You should select your deck first`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });

  }

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    setSelectValue(e.target.value);
  }

  return (
    <main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {isLoading? (
        <Loader />
      ) : (
      <div className="card-profile">
        <div className="card-profile__flex">
          <div className="card-image">
            <img src={card?.image_uris?.normal} alt={card?.name} />
            <div className="card-name">
              <h2>{card?.name}</h2>
              <h3>{card?.set_name}</h3>
            </div>
          </div>
          <div className="card-detail">
            <h3>Card Details</h3>
            <div className="detail-container">
              <ul className="list-details">
                <li>
                  <strong>Name: </strong> {card?.name}
                </li>
                <li>
                  <strong>Type: </strong> {card?.type_line}
                </li>
                <li>
                  <strong>Power:</strong> {card?.power}
                </li>
                <li>
                  <strong>Toughness: </strong> {card?.toughness}
                </li>
                <li>
                  <strong>Colors: </strong> {card?.colors}
                </li>
                <li>
                  <strong>Rarity: </strong> {card?.rarity}
                </li>
                <li>
                  <strong>Set Name: </strong> {card?.set_name}
                </li>
                <li>
                  <strong>Release Date: </strong> {card?.released_at}
                </li>
                <li>
                  <strong>Artist: </strong> {card?.artist}
                </li>
                <li>
                  <strong>Language: </strong> {card?.lang}
                </li>
                <div className="keywords">
                  <strong>Keywords: </strong>
                  {card?.keywords.map((keyword) => {
                    return (
                      <span key={keyword} className="keyword">
                      {keyword } 
                      </span>
                    );
                  })}
                </div>
              </ul>
              <h4>Your Decks</h4>
              <div id="deck-container">
              <select
                value={selectValue}
                onChange={handleChange}
                onClick={fetchUserDecks}
                name="decks"
                id="decks"
              >
                <option key="first_value" value="">
                  Select Your Deck To Add The Card
                </option>
                {decksId.length > 0 &&
                  decksId.map((deck) => {
                    return (
                      <option key={deck.id} value={deck.id}>
                        {deck.deck_name}
                      </option>
                    );
                  })}
              </select>
              <button onClick={AddToDeck} type="button" className="add-to-deck">
                Add to Deck
              </button>
              </div>
            </div>
          </div>
          <div className="price-details">
            <h3>Card Pricing</h3>
                <div className="price-container">
              <ul className="list-details">
                <li><strong>USD: </strong>$ {card?.prices.usd}</li>
                <li><strong>EUR: </strong>&euro; {card?.prices.eur}</li>
                <li><strong>TIX: </strong> {card?.prices.tix}</li>
              </ul>
          </div>
              <h3>Links to purchase</h3>
              <ul className="list-details">
                <li>Tcgplayer.com: <a href={card?.purchase_uris?.tcgplayer} target="_blank">buy card</a></li>
                <li>Cardhoarder.com: <a href={card?.purchase_uris?.cardhoarder} target="_blank">buy card</a></li>
                <li>Cardmarket.com: <a href={card?.purchase_uris?.cardmarket} target="_blank">buy card</a></li>
              </ul>
          </div>
        </div>
      </div>
      )}
    </main>
  );
}

export default CardPage;
