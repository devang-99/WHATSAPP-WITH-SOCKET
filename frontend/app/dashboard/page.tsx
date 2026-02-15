/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import "./main.css";

import EmojiPicker from "emoji-picker-react";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SendIcon from "@mui/icons-material/Send";
import Avatar from "@mui/material/Avatar";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";

import { useRouter } from "next/navigation";
import { getSocket } from "../lib/socket";

import { useAppDispatch, useAppSelector } from "../utils/hooks";
import { logout, fetchUsers, fetchCurrentUser } from "@/redux/authSlice";
import { clearMessages, setMessages, addMessage } from "@/redux/messageSlice";

/* =========================================================
   TYPES
========================================================= */

type User = {
  id: string;
  username: string;
  profilePic?: string | null;
  isOnline?: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

const getAvatarUrl = (file?: string | null) =>
  file ? `http://localhost:3001/uploads/${file}` : undefined;

/* Optional nice colored avatars when no image */
const stringToColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${hash % 360}, 60%, 50%)`;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function Main() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const currentUser = useAppSelector(
    (state) => state.authenticator.currentUser
  );

  const messages = useAppSelector((state) => state.messenger.messages);

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const me = currentUser?.userid;
  const targetUser = selectedUser?.id;
  const roomId = me && targetUser ? [me, targetUser].sort().join("_") : null;
  const menuOpen = Boolean(anchorEl);

  /* =========================================================
     FETCH USERS
  ========================================================= */

  useEffect(() => {
    if (!currentUser) return;

    dispatch(fetchUsers({ page: 1, limit: 50 }))
      .unwrap()
      .then((res: any) => {
        setUsers(
          res.data
            .filter((u: any) => u.userid !== currentUser.userid)
            .map((u: any) => ({
              id: u.userid,
              username: u.username,
              isOnline: u.isOnline,
              profilePic: u.profilePic,
            }))
        );
      });
  }, [currentUser, dispatch]);

useEffect(() => {
  if (currentUser?.userid) {
    dispatch(fetchCurrentUser(currentUser.userid));
  }
}, [currentUser?.userid, dispatch]);



  /* =========================================================
     SOCKET CONNECT
  ========================================================= */

  useEffect(() => {
    if (!me) return;

    const socket = getSocket();
    if (!socket) return;

    socket.connect();
    socket.emit("onConnection", me);

    return () => {
      socket.disconnect();
    };
  }, [me]);

  /* =========================================================
     ONLINE STATUS
  ========================================================= */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const online = ({ userid }: any) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userid ? { ...u, isOnline: true } : u))
      );
    };

    const offline = ({ userid }: any) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userid ? { ...u, isOnline: false } : u))
      );
    };

    socket.on("userOnline", online);
    socket.on("userOffline", offline);

    return () => {
      socket.off("userOnline", online);
      socket.off("userOffline", offline);
    };
  }, []);

  /* =========================================================
     FETCH MESSAGES
  ========================================================= */

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    if (!socket) return;

    dispatch(clearMessages());
    socket.emit("joinRoom", roomId);
    socket.emit("fetchMessages", roomId);

    socket.on("getMessages", (msgs: any[]) => dispatch(setMessages(msgs)));
    socket.on("newMessage", (msg: any) => dispatch(addMessage(msg)));

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("getMessages");
      socket.off("newMessage");
    };
  }, [roomId, dispatch]);

  /* =========================================================
     TYPING
  ========================================================= */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onTyping = () => {
      setOtherUserTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setOtherUserTyping(false), 2000);
    };

    socket.on("usertyping", onTyping);
    return () => {socket.off("usertyping", onTyping);}
  }, []);

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const handleSendMessage = () => {
    if (!messageText.trim() || !roomId) return;

    getSocket()?.emit("sendMessage", {
      roomId,
      text: messageText,
      senderId: me,
      receiverId: targetUser,
    });

    setMessageText("");
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    getSocket()?.disconnect();
    dispatch(logout());
    router.push("/login");
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="whatsapp-app">

      {/* ================= SIDEBAR ================= */}

      <div className="sidebar">
        <div className="sidebar-header">Users</div>

        <input
          placeholder="Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="user-list">
          {users
            .filter((u) =>
              u.username.toLowerCase().includes(search.toLowerCase())
            )
            .map((user) => (
              <div
                key={user.id}
                className={`user-item ${
                  selectedUser?.id === user.id ? "active" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="user-avatar">
                  <Avatar
                    src={getAvatarUrl(user.profilePic)}
                    sx={{
                      bgcolor: user.profilePic
                        ? undefined
                        : stringToColor(user.username),
                    }}
                  >
                    {!user.profilePic && user.username[0].toUpperCase()}
                  </Avatar>

                  {user.isOnline && <span className="online-dot" />}
                </div>

                <strong>{user.username}</strong>
              </div>
            ))}
        </div>
      </div>

      {/* ================= CHAT ================= */}

      <div className="chat-window">

        {/* HEADER */}
        <AppBar position="static">
          <Toolbar sx={{ justifyContent: "space-between" }}>

            {/* LEFT — selected user */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {selectedUser && (
                <Avatar src={getAvatarUrl(selectedUser.profilePic)}>
                  {!selectedUser.profilePic &&
                    selectedUser.username[0].toUpperCase()}
                </Avatar>
              )}
              <Typography variant="h6">
                {selectedUser?.username || "WhatsApp"}
              </Typography>
            </div>

            {/* RIGHT — logged in user */}
            {currentUser && (
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar src={getAvatarUrl(currentUser.profilePic)}>
                  {!currentUser.profilePic &&
                    currentUser.username?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            )}

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleLogout} sx={{ color: "red" }}>
                Logout
              </MenuItem>
              <MenuItem onClick={() => router.push("/profile")}>
                Profile
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* ================= MESSAGES ================= */}

        <div className="chat-messages">
          {messages.map((msg: any) => {
            const isMe = msg.senderId === me;

            return (
              <div
                key={msg.id}
                className={`message-row ${isMe ? "me" : "other"}`}
              >
                <div className={`message-bubble ${isMe ? "sent" : "received"}`}>
                  {msg.message}
                  <div className="msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {otherUserTyping && (
            <div className="message-row other">
              <div className="typing-bubble">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ================= INPUT ================= */}

        {selectedUser && (
          <div className="chat-input">
            <IconButton onClick={() => setShowEmojiPicker((p) => !p)}>
              <SentimentSatisfiedAltIcon />
            </IconButton>

            <input
              value={messageText}
              placeholder="Type a message"
              onChange={(e) => {
                setMessageText(e.target.value);
                getSocket()?.emit("typing", { roomId, userid: me });
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />

            <IconButton onClick={handleSendMessage}>
              <SendIcon />
            </IconButton>
          </div>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker
              onEmojiClick={(e) => setMessageText((p) => p + e.emoji)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
