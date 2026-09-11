import { airportPending, buyPending, createGame, rollDice, useCard } from "./monopoly.js";
export function createSession(roomId,ownerPeerId,members,options={}){const seats=[...new Set(members)].slice(0,4).map((peerId,i)=>({peerId,nickname:`玩家 ${i+1}`,ready:false,isBot:false}));return{roomId,ownerPeerId,phase:"lobby",seats,game:createGame(seats,options),chat:[],appliedEventKeys:[]};}
export function applyEvent(state,event){if(event.roomId!==state.roomId||event.gameId!=="monopoly"||state.appliedEventKeys.includes(event.idempotencyKey))return state;let next=structuredClone(state),seat=next.seats.find(s=>s.peerId===event.senderPeerId);
  if(event.type==="monopoly.ready"&&state.phase==="lobby"&&seat)seat.ready=event.payload?.ready===true;
  else if(event.type==="monopoly.add_bot"&&state.phase==="lobby"&&event.senderPeerId===state.ownerPeerId&&state.seats.length<4){const n=state.seats.length+1;next.seats.push({peerId:`bot:${n}`,nickname:`机器人 ${n}`,ready:true,isBot:true});next.game=createGame(next.seats,{startingCoins:state.game.startingCoins,maxRounds:state.game.maxRounds});}
  else if(event.type==="monopoly.start"&&state.phase==="lobby"&&event.senderPeerId===state.ownerPeerId&&state.seats.length>=2&&state.seats.every(s=>s.ready)){next.phase="playing";next.game=createGame(next.seats,{startingCoins:event.payload?.startingCoins??5000,maxRounds:event.payload?.maxRounds??20,seed:event.payload?.seed});}
  else if(event.type==="monopoly.roll"&&state.phase==="playing")next.game=rollDice(state.game,event.senderPeerId,event.payload?.values);
  else if(event.type==="monopoly.buy"&&state.phase==="playing")next.game=buyPending(state.game,event.senderPeerId,event.payload?.buy!==false);
  else if(event.type==="monopoly.airport"&&state.phase==="playing")next.game=airportPending(state.game,event.senderPeerId,event.payload?.index);
  else if(event.type==="monopoly.card"&&state.phase==="playing")next.game=useCard(state.game,event.senderPeerId,event.payload?.card,event.payload?.target);
  else if(event.type==="monopoly.chat"&&String(event.payload?.content??"").trim()){next.chat.push({senderPeerId:event.senderPeerId,content:String(event.payload.content).trim(),timestamp:event.timestamp??Date.now()});next.chat=next.chat.slice(-80);}
  else if(event.type==="monopoly.restart"&&state.phase==="ended"&&event.senderPeerId===state.ownerPeerId){next=createSession(state.roomId,state.ownerPeerId,state.seats.map(s=>s.peerId),{startingCoins:state.game.startingCoins,maxRounds:state.game.maxRounds});next.seats=state.seats.map(s=>({...s,ready:s.isBot||false}));}
  else return state;
  if(next.game.ended){next.phase="ended";}
  next.appliedEventKeys=[...state.appliedEventKeys,event.idempotencyKey].slice(-2048);return next;}
