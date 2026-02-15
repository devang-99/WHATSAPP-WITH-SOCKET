"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAppSelector } from "../utils/hooks";

import "./profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const currentUser = useAppSelector(
    (state) => state.authenticator.currentUser
  );

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [preview, setPreview] = useState<string | null>(
    currentUser?.profilePic || null
  );
  const [file, setFile] = useState<File | null>(null);

  /* ================= IMAGE SELECT ================= */

  const handlePickImage = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  /* ================= SAVE PROFILE ================= */

 const handleSave = async () => {
  try {
    const formData = new FormData();
    formData.append("bio", bio);

    if (file) {
      formData.append("profilePic", file);
    }

    await fetch(
      `http://localhost:3001/auth/profile/${currentUser?.userid}`, // ✅ FIXED
      {
        method: "PATCH",
        body: formData,
        credentials: "include",
      }
    );

    setEditing(false);
    alert("Profile updated");

  } catch (err) {
    console.error(err);
    alert("Failed to update profile");
  }
};

  /* ================= UI ================= */

  return (
    <div className="profile-page">

      {/* HEADER */}
      <div className="profile-header">
        <IconButton onClick={() => router.back()}>
          <ArrowBackIcon />
        </IconButton>
        <h2>Profile</h2>
      </div>

      {/* AVATAR */}
      <div className="profile-avatar-wrapper">
        <Avatar
          src={preview || ""}
          sx={{ width: 140, height: 140 }}
        />

        {editing && (
          <IconButton className="edit-avatar-btn" onClick={handlePickImage}>
            <EditIcon />
          </IconButton>
        )}

        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {/* USERNAME */}
      <div className="profile-field">
        <label>Name</label>
        <div className="profile-value">{currentUser?.username}</div>
      </div>

      {/* BIO */}
      <div className="profile-field">
        <label>About</label>

        {editing ? (
          <TextField
            fullWidth
            multiline
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        ) : (
          <div className="profile-value">{bio || "Hey there! I am using chat."}</div>
        )}
      </div>

      {/* BUTTONS */}
      <div className="profile-actions">
        {editing ? (
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        ) : (
          <Button variant="outlined" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

    </div>
  );
}
