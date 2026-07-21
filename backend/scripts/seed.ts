import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { Contact } from "../models/contact.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { generateAnonimiId } from "../utils/generateId";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/anonimi";
const PASSWORD = "password123";

const UNSPLASH_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop",
];

const USER_SEED_DATA = [
  { username: "alexrivera", displayName: "Alex Rivera", email: "alex@test.com", avatarIdx: 0 },
  { username: "jamiechen", displayName: "Jamie Chen", email: "jamie@test.com", avatarIdx: 1 },
  { username: "samwilson", displayName: "Sam Wilson", email: "sam@test.com", avatarIdx: 2 },
  { username: "taylorkim", displayName: "Taylor Kim", email: "taylor@test.com", avatarIdx: 3 },
  { username: "morganpatel", displayName: "Morgan Patel", email: "morgan@test.com", avatarIdx: 4 },
  { username: "caseyjohnson", displayName: "Casey Johnson", email: "casey@test.com", avatarIdx: 5 },
  { username: "rileythompson", displayName: "Riley Thompson", email: "riley@test.com", avatarIdx: 6 },
  { username: "jordangarcia", displayName: "Jordan Garcia", email: "jordan@test.com", avatarIdx: 7 },
];

type MsgDef = { fromIndex: number; text: string; hoursAgo: number };
type ConvoDef = { pair: [number, number]; messages: MsgDef[] };

const CONVO_ALEX_JAMIE: ConvoDef = {
  pair: [0, 1],
  messages: [
    { fromIndex: 0, text: "Hey Jamie! How's the project coming along?", hoursAgo: 72 },
    { fromIndex: 1, text: "Hey Alex! It's going well, just finishing up the UI mockups", hoursAgo: 71 },
    { fromIndex: 0, text: "Nice! Can you share them when you're done?", hoursAgo: 71 },
    { fromIndex: 1, text: "Sure! I'll send them over by tomorrow morning", hoursAgo: 70 },
    { fromIndex: 1, text: "Actually, do you have time for a quick call later?", hoursAgo: 48 },
    { fromIndex: 0, text: "Yeah, I'm free around 3pm. That work for you?", hoursAgo: 48 },
    { fromIndex: 1, text: "Great meeting earlier! The feedback was really helpful", hoursAgo: 24 },
    { fromIndex: 0, text: "Agreed! I think we're on the right track now", hoursAgo: 23 },
    { fromIndex: 1, text: "I've updated the designs based on your suggestions", hoursAgo: 12 },
    { fromIndex: 0, text: "Awesome, I'll take a look and get back to you", hoursAgo: 11 },
    { fromIndex: 1, text: "Sounds good! Also, are we still on for lunch tomorrow?", hoursAgo: 5 },
    { fromIndex: 0, text: "Definitely! Same place at 12:30?", hoursAgo: 4 },
    { fromIndex: 1, text: "You read my mind 😄", hoursAgo: 4 },
  ],
};

const CONVO_SAM_TAYLOR: ConvoDef = {
  pair: [2, 3],
  messages: [
    { fromIndex: 0, text: "Hey Taylor, did you see the latest update?", hoursAgo: 96 },
    { fromIndex: 1, text: "Not yet! What changed?", hoursAgo: 95 },
    { fromIndex: 0, text: "They finally fixed the search functionality", hoursAgo: 95 },
    { fromIndex: 1, text: "Oh finally! That was so buggy before", hoursAgo: 94 },
    { fromIndex: 1, text: "Have you tried the new dark mode?", hoursAgo: 72 },
    { fromIndex: 0, text: "Yeah, it looks really clean. I'm using it now", hoursAgo: 71 },
    { fromIndex: 1, text: "Btw, are you going to the team outing?", hoursAgo: 48 },
    { fromIndex: 0, text: "Yeah, I RSVP'd yesterday. Should be fun!", hoursAgo: 47 },
    { fromIndex: 1, text: "Me too! Heard there's gonna be kayaking", hoursAgo: 47 },
    { fromIndex: 0, text: "Wait really? That's awesome", hoursAgo: 46 },
    { fromIndex: 1, text: "Want to carpool there?", hoursAgo: 24 },
    { fromIndex: 0, text: "Sure! I can drive, pick you up at 8?", hoursAgo: 23 },
    { fromIndex: 1, text: "Perfect, see you then!", hoursAgo: 23 },
  ],
};

const CONVO_MORGAN_CASEY: ConvoDef = {
  pair: [4, 5],
  messages: [
    { fromIndex: 0, text: "Hey Casey! How was your weekend?", hoursAgo: 48 },
    { fromIndex: 1, text: "It was great! Went hiking up in the mountains", hoursAgo: 47 },
    { fromIndex: 0, text: "That sounds amazing! Which trail?", hoursAgo: 47 },
    { fromIndex: 1, text: "The Eagle Peak trail. The views were incredible", hoursAgo: 46 },
    { fromIndex: 1, text: "About 6 miles round trip. Moderate难度", hoursAgo: 45 },
    { fromIndex: 0, text: "We should go together sometime", hoursAgo: 45 },
    { fromIndex: 1, text: "Definitely! Maybe next weekend if the weather's good", hoursAgo: 44 },
    { fromIndex: 1, text: "Oh, did you finish that book you were reading?", hoursAgo: 24 },
    { fromIndex: 0, text: "Almost done! The plot twist at the end is crazy", hoursAgo: 23 },
    { fromIndex: 1, text: "No spoilers! I just started it", hoursAgo: 23 },
    { fromIndex: 1, text: "Want to grab coffee this evening?", hoursAgo: 6 },
    { fromIndex: 0, text: "Sure! The usual place at 6?", hoursAgo: 5 },
    { fromIndex: 1, text: "You know it ☕", hoursAgo: 5 },
  ],
};

const CONVO_ALEX_SAM: ConvoDef = {
  pair: [0, 2],
  messages: [
    { fromIndex: 0, text: "Hey Sam, are you coming to the meetup on Friday?", hoursAgo: 60 },
    { fromIndex: 1, text: "Which one? The dev meetup?", hoursAgo: 59 },
    { fromIndex: 0, text: "Yeah, the one at the tech hub downtown", hoursAgo: 59 },
    { fromIndex: 1, text: "Oh yeah, I registered last week! You?", hoursAgo: 58 },
    { fromIndex: 1, text: "I'm most excited about the AI workshop", hoursAgo: 57 },
    { fromIndex: 0, text: "Me too! I heard the speaker is really good", hoursAgo: 57 },
    { fromIndex: 0, text: "Want to grab dinner before?", hoursAgo: 36 },
    { fromIndex: 1, text: "Sure! There's a great ramen place nearby", hoursAgo: 35 },
    { fromIndex: 1, text: "How about 6pm at Ramen House?", hoursAgo: 34 },
    { fromIndex: 0, text: "Perfect, see you there!", hoursAgo: 34 },
    { fromIndex: 1, text: "Can't wait! 🍜", hoursAgo: 33 },
  ],
};

const CONVO_JAMIE_TAYLOR: ConvoDef = {
  pair: [1, 3],
  messages: [
    { fromIndex: 0, text: "Hey Taylor! Got the files you sent", hoursAgo: 36 },
    { fromIndex: 1, text: "Great! What do you think?", hoursAgo: 35 },
    { fromIndex: 0, text: "They look solid! Just a few minor suggestions", hoursAgo: 35 },
    { fromIndex: 0, text: "Also, are you free for a brainstorming session?", hoursAgo: 24 },
    { fromIndex: 1, text: "Yeah, how about tomorrow at 2?", hoursAgo: 23 },
    { fromIndex: 0, text: "Works for me! I'll prepare some ideas", hoursAgo: 23 },
    { fromIndex: 1, text: "Cool, looking forward to it!", hoursAgo: 22 },
    { fromIndex: 0, text: "Same here! Should be productive", hoursAgo: 22 },
  ],
};

const CONVERSATIONS = [CONVO_ALEX_JAMIE, CONVO_SAM_TAYLOR, CONVO_MORGAN_CASEY, CONVO_ALEX_SAM, CONVO_JAMIE_TAYLOR];

const GROUP_MESSAGES: MsgDef[] = [
  { fromIndex: 0, text: "Hey everyone! Welcome to Tech Talk group 🎉", hoursAgo: 120 },
  { fromIndex: 2, text: "Thanks Alex! Excited to be here", hoursAgo: 119 },
  { fromIndex: 1, text: "Same here! This should be fun", hoursAgo: 119 },
  { fromIndex: 3, text: "What's the first topic?", hoursAgo: 118 },
  { fromIndex: 0, text: "I was thinking we could discuss the latest React updates", hoursAgo: 118 },
  { fromIndex: 4, text: "Ooh yes! The new server components are game-changing", hoursAgo: 117 },
  { fromIndex: 2, text: "Has anyone tried them in production yet?", hoursAgo: 96 },
  { fromIndex: 1, text: "I have! They're amazing for data fetching", hoursAgo: 95 },
  { fromIndex: 3, text: "Any gotchas we should know about?", hoursAgo: 95 },
  { fromIndex: 1, text: "Just make sure you understand the client/server boundary", hoursAgo: 94 },
  { fromIndex: 4, text: "Speaking of which, has anyone tried Next.js 15?", hoursAgo: 72 },
  { fromIndex: 2, text: "Yes! Turbopack is noticeably faster", hoursAgo: 71 },
  { fromIndex: 3, text: "I'm still on 14. Worth the upgrade?", hoursAgo: 71 },
  { fromIndex: 0, text: "Definitely. The DX improvements alone are worth it", hoursAgo: 70 },
  { fromIndex: 4, text: "I'm building a real-time collaborative whiteboard", hoursAgo: 47 },
  { fromIndex: 3, text: "That sounds cool! WebSockets?", hoursAgo: 47 },
  { fromIndex: 4, text: "Yeah, using Socket.IO. It's been fun", hoursAgo: 46 },
  { fromIndex: 2, text: "I've been diving into Rust lately", hoursAgo: 30 },
  { fromIndex: 0, text: "Oh nice! Systems programming?", hoursAgo: 29 },
  { fromIndex: 2, text: "Yeah, building a CLI tool for managing dotfiles", hoursAgo: 29 },
  { fromIndex: 3, text: "Rust is on my list to learn. How's the learning curve?", hoursAgo: 28 },
  { fromIndex: 2, text: "Steep at first, but the compiler errors are super helpful", hoursAgo: 28 },
  { fromIndex: 4, text: "The borrow checker is a rite of passage 😄", hoursAgo: 27 },
  { fromIndex: 2, text: "Haha exactly! Once it clicks though, everything makes sense", hoursAgo: 27 },
  { fromIndex: 1, text: "Has anyone tried the new CSS container queries?", hoursAgo: 12 },
  { fromIndex: 3, text: "Yes! They're a lifesaver for responsive components", hoursAgo: 11 },
  { fromIndex: 0, text: "I've been using them in production. Browser support is great now", hoursAgo: 10 },
  { fromIndex: 4, text: "Good to know. I've been relying on media queries still", hoursAgo: 10 },
  { fromIndex: 1, text: "Container queries + clamp() = responsive nirvana", hoursAgo: 9 },
  { fromIndex: 2, text: "Haha that's the perfect combo", hoursAgo: 8 },
  { fromIndex: 0, text: "Alright team, let's do this again next week?", hoursAgo: 4 },
  { fromIndex: 3, text: "Same time, same place! I'll pick a topic", hoursAgo: 3 },
  { fromIndex: 1, text: "Sounds good! 🚀", hoursAgo: 3 },
  { fromIndex: 4, text: "See you all next week!", hoursAgo: 2 },
  { fromIndex: 2, text: "👋", hoursAgo: 2 },
];

async function seed() {
  const clearFlag = process.argv.includes("--clear");

  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  if (clearFlag) {
    console.log("Clearing existing seed data...");
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    await Contact.deleteMany({});
    await Group.deleteMany({});
    await GroupMember.deleteMany({});
    console.log("Cleared.\n");
  }

  const existingUsers = await User.find({ email: { $regex: /@test\.com$/ } }).lean();
  if (existingUsers.length > 0 && !clearFlag) {
    console.log(`Found ${existingUsers.length} existing test users. Use --clear to reseed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  console.log("Creating users...");
  const userDocs = await User.insertMany(
    USER_SEED_DATA.map((u) => ({
      anonimiId: generateAnonimiId(),
      username: u.username,
      email: u.email,
      passwordHash,
      profileImage: UNSPLASH_AVATARS[u.avatarIdx],
      status: "active",
      emailVerified: true,
      lastSeen: new Date(),
    }))
  );
  const users = userDocs.map((u) => u._id.toString());
  const usernameByIndex = USER_SEED_DATA.map((u) => u.username);
  console.log(`  Created ${users.length} users.\n`);

  console.log("Creating contacts...");
  const contactPairs = new Set<string>();
  for (const c of CONVERSATIONS) {
    const pair = c.pair;
    const key1 = `${pair[0]}-${pair[1]}`;
    const key2 = `${pair[1]}-${pair[0]}`;
    if (!contactPairs.has(key1) && !contactPairs.has(key2)) {
      contactPairs.add(key1);
      await Contact.create({
        userId: new mongoose.Types.ObjectId(users[pair[0]]),
        contactId: new mongoose.Types.ObjectId(users[pair[1]]),
        status: "accepted",
      });
      await Contact.create({
        userId: new mongoose.Types.ObjectId(users[pair[1]]),
        contactId: new mongoose.Types.ObjectId(users[pair[0]]),
        status: "accepted",
      });
    }
  }
  console.log(`  Created ${contactPairs.size * 2} contact records.\n`);

  console.log("Creating conversations and messages...");
  for (const convo of CONVERSATIONS) {
    const [u1, u2] = convo.pair;
    const convoDoc = await Conversation.create({
      type: "private",
      participants: [new mongoose.Types.ObjectId(users[u1]), new mongoose.Types.ObjectId(users[u2])],
    });

    const now = Date.now();
    const msgDocs = [];
    for (const m of convo.messages) {
      const senderId = m.fromIndex === 0 ? users[u1] : users[u2];
      msgDocs.push({
        conversationId: convoDoc._id,
        senderId: new mongoose.Types.ObjectId(senderId),
        type: "text",
        content: m.text,
        createdAt: new Date(now - m.hoursAgo * 3600000),
        isE2ee: false,
      });
    }

    const createdMessages = await Message.insertMany(msgDocs);
    const lastMsg = createdMessages[createdMessages.length - 1];
    convoDoc.lastMessage = {
      content: lastMsg.content,
      senderId: lastMsg.senderId,
      type: lastMsg.type,
      timestamp: lastMsg.createdAt,
      isE2ee: false,
    };
    await convoDoc.save();
    console.log(`  ${usernameByIndex[u1]} <-> ${usernameByIndex[u2]}: ${createdMessages.length} messages`);
  }

  const groupUserIndices = [0, 1, 2, 3, 4];
  const groupUserIds = groupUserIndices.map((i) => new mongoose.Types.ObjectId(users[i]));
  const creatorIndex = 0;

  console.log("\nCreating group conversation 'Tech Talk'...");
  const groupConvo = await Conversation.create({
    type: "group",
    participants: groupUserIds,
  });

  const GROUP_IMAGE = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop";

  const group = await Group.create({
    conversationId: groupConvo._id,
    name: "Tech Talk",
    description: "A group for discussing the latest in tech, programming, and side projects.",
    image: GROUP_IMAGE,
    ownerId: groupUserIds[creatorIndex],
  });

  for (let i = 0; i < groupUserIndices.length; i++) {
    await GroupMember.create({
      groupId: group._id,
      userId: groupUserIds[i],
      role: i === creatorIndex ? "owner" : "member",
      joinedVia: "group_create",
      joinedAt: new Date(Date.now() - 120 * 3600000),
    });
  }

  const now = Date.now();
  const groupMsgDocs = [];
  for (const m of GROUP_MESSAGES) {
    const senderId = groupUserIds[m.fromIndex];
    groupMsgDocs.push({
      conversationId: groupConvo._id,
      senderId,
      type: "text",
      content: m.text,
      createdAt: new Date(now - m.hoursAgo * 3600000),
      isE2ee: false,
    });
  }
  const createdGroupMessages = await Message.insertMany(groupMsgDocs);
  const lastGroupMsg = createdGroupMessages[createdGroupMessages.length - 1];
  groupConvo.lastMessage = {
    content: lastGroupMsg.content,
    senderId: lastGroupMsg.senderId,
    type: lastGroupMsg.type,
    timestamp: lastGroupMsg.createdAt,
    isE2ee: false,
  };
  await groupConvo.save();
  console.log(`  Tech Talk: ${createdGroupMessages.length} messages, ${groupUserIndices.length} members\n`);

  console.log("Seed complete!");
  console.log("---");
  for (let i = 0; i < USER_SEED_DATA.length; i++) {
    console.log(`  ${USER_SEED_DATA[i].username} / ${PASSWORD}  (${USER_SEED_DATA[i].displayName})`);
  }
  console.log("---");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
