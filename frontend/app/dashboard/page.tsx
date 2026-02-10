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
import AccountCircle from "@mui/icons-material/AccountCircle";

import { useRouter } from "next/navigation";
import { getSocket } from "../lib/socket";

import { useAppDispatch, useAppSelector } from "../utils/hooks";
import { logout, fetchUsers } from "@/redux/authSlice";
import {
  clearMessages,
  setMessages,
  addMessage,
} from "@/redux/messageSlice";
import type { Message } from "@/redux/messageSlice";

type User = {
  id: string;
  username: string;
  email: string;
  isOnline?: boolean;
};

export default function Main() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const currentUser = useAppSelector(
    (state) => state.authenticator.currentUser,
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
  const roomId =
    me && targetUser ? [me, targetUser].sort().join("_") : null;

  const menuOpen = Boolean(anchorEl);

  /* ================= FETCH USERS ================= */

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
              email: u.email,
              isOnline: u.isOnline,
            })),
        );
      });
  }, [currentUser, dispatch]);

  /* ================= SOCKET CONNECT ================= */

  useEffect(() => {
    if (!me) return;

    const socket = getSocket();
    if (!socket) return;

    socket.connect();
    socket.emit("onConnection", me);

    return () => {
      socket.emit("onDisconnection", me);
      socket.disconnect();
    };
  }, [me]);

  /* ================= ONLINE / OFFLINE ================= */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const online = ({ userid }: any) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userid ? { ...u, isOnline: true } : u,
        ),
      );
    };

    const offline = ({ userid }: any) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userid ? { ...u, isOnline: false } : u,
        ),
      );
    };

    socket.on("userOnline", online);
    socket.on("userOffline", offline);

    return () => {
      socket.off("userOnline", online);
      socket.off("userOffline", offline);
    };
  }, []);

  /* ================= FETCH / RECEIVE MESSAGES ================= */

  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    if (!socket) return;

    dispatch(clearMessages());
    socket.emit("fetchMessages", roomId);

    const onGetMessages = (msgs: any[]) => {
      const normalized: Message[] = msgs.map((m) => ({
        id: m.id,
        roomId,
        senderId: m.senderId,
        receiverId: m.receiverId,
        message: m.message,
        createdAt: m.createdAt,
      }));
      dispatch(setMessages(normalized));
    };

    const onNewMessage = (m: any) => {
      dispatch(
        addMessage({
          id: m.id,
          roomId,
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: m.message,
          createdAt: m.createdAt,
        }),
      );
    };

    socket.on("getMessages", onGetMessages);
    socket.on("newMessage", onNewMessage);

    return () => {
      socket.off("getMessages", onGetMessages);
      socket.off("newMessage", onNewMessage);
    };
  }, [roomId, dispatch]);

  /* ================= TYPING ================= */

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onTyping = () => {
      setOtherUserTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(
        () => setOtherUserTyping(false),
        2000,
      );
    };

    socket.on("usertyping", onTyping);
    return () => {socket.off("usertyping", onTyping);}
  }, []);

  /* ================= SCROLL ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */

  const handleSendMessage = () => {
    if (!messageText.trim() || !roomId) return;

    const socket = getSocket();
    socket?.emit("sendMessage", {
      roomId,
      text: messageText,
      senderId: me,
      receiverId: targetUser,
    });

    setMessageText("");
  };

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    const socket = getSocket();
    socket?.emit("onDisconnection", me);
    socket?.disconnect();

    dispatch(logout());
    router.push("/login");
  };

  /* ================= UI ================= */

  return (
    <div className="whatsapp-app">
      <div className="sidebar">
        <div className="sidebar-header">Users</div>

        <input
          placeholder="🔍 Search users"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="user-list">
          {users
            .filter((u) =>
              u.email.toLowerCase().includes(search.toLowerCase()),
            )
            .map((user) => (
              <div
                key={user.id}
                className={`user-item ${
                  selectedUser?.id === user.id ? "active" : ""
                }`}
                onClick={() => setSelectedUser(user)}
              >
                <Avatar sx={{ bgcolor: "#15e461" }}>
                  {user.username?.[0]?.toUpperCase()}
                </Avatar>

                <div>
                  <strong>{user.username}</strong>
                  <br />
                  <small>{user.email}</small>
                </div>

                <span
                  className={`status-dot ${
                    user.isOnline ? "online" : "offline"
                  }`}
                />
              </div>
            ))}
        </div>
      </div>

      <div className="chat-window">
        <AppBar position="static" sx={{ backgroundColor: "#178f6b" }}>
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6">
              {selectedUser?.username || "WhatsApp"}
            </Typography>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <AccountCircle />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={handleLogout} sx={{ color: "red" }}>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.senderId === me ? "sent" : "received"
              }`}
            >
              {msg.message}
            </div>
          ))}

          {otherUserTyping && <em>Typing...</em>}
          <div ref={messagesEndRef} />
        </div>

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
                const socket = getSocket();
                socket?.emit("typing", {
                  userid: me,
                  receiverId: targetUser,
                });
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSendMessage()
              }
            />

            <IconButton onClick={handleSendMessage}>
              <SendIcon />
            </IconButton>
          </div>
        )}

        {showEmojiPicker && (
          <div className="emoji-picker">
            <EmojiPicker
              onEmojiClick={(e) =>
                setMessageText((p) => p + e.emoji)
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
