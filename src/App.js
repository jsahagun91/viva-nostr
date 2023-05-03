import "./App.css";
import { generatePrivateKey, getEventHash, getPublicKey, relayInit, signEvent } from "nostr-tools";
import { useEffect, useState } from "react";

function App() {
  // eslint-disable-next-line
  const [sk, setSk] = useState(generatePrivateKey());
  const [pk, setPk] = useState(getPublicKey(sk));
  const [relay, setRelay] = useState(null);
  const [pubStatus, setPubStatus] = useState("");
  const [newEvent, setNewEvent] = useState(null);
  const [events, setEvents] = useState(null);

  useEffect(() => {
    const connectRelay = async () => {
      const relay = relayInit("wss://relay.damus.io");
      await relay.connect();

      relay.on("connect", () => {
        setRelay(relay);
      });
      relay.on("error", () => {
        console.log("failed to connect");
      });
    };

    connectRelay();
  });

  var event = {
    kind: 1,
    pubkey: pk,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: "We are testing nostr in react"
  }

  event.id = getEventHash(event);
  event.sig = signEvent(event, sk);

  const publishEvent = (event) => {
    const pub = relay.publish(event);

    pub.on('ok', () => {
      setPubStatus("our event is published");
    })
    pub.on('failed', reason => {
      setPubStatus(`failed to publish message ${reason}` )
    })
  }

  const getEvent = async () => {
    var sub = relay.sub([{
      kinds: [1],
      authors: [pk]
    }])
    sub.on('event', event => {
      setNewEvent(event)
    })
  }

  const getEvents = async () => {
    var events =  await relay.list([{
      kinds: [1]
    }])
    setEvents(events);
  }

  return (
    <div className="viva-nostr">
      <div className="card">
      <h1>¡Viva Nostr!</h1>
      <p>private key: {sk} </p>
      <p>public key: {pk} </p>
      </div>
      {relay ? (
        <p> Connect to {relay.url}</p>
      ) : (
        <p> Couldn not connect to relay </p>
      )}
      <button onClick={(() => publishEvent(event))}>Publish Event</button>
      <p>Publish status {pubStatus}</p>
      <button onClick={(() => getEvent())}>Subscribe Event</button>
      {newEvent ? <p>Subscribed event content: {newEvent.content} {pubStatus}</p> : <p> No new event </p>}
      <button onClick={(() => getEvents())}>Load feed</button>  
      {events !== null && 
      events.map((event) => 
      <p key={event.sig} style={{borderStyle: 'ridge', padding: 10}}>{event.content}</p>
      )}
    </div>
  );
}

export default App;
