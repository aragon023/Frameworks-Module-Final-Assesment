import React, { useEffect, useState } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";

const ProfilePage: React.FC = () => {
  const { userQuery, updateUser, changePassword } = useCurrentUser();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userQuery.data) {
      setUsername(userQuery.data.username);
      setEmail(userQuery.data.email);
      setFirstName(userQuery.data.first_name);
      setLastName(userQuery.data.last_name);
    }
  }, [userQuery.data]);

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);

    updateUser.mutate(
      {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
      },
      {
        onSuccess: () => {
          setProfileMessage("Profile updated successfully.");
        },
        onError: (err) => {
          setProfileMessage(err.message || "Failed to update profile.");
        },
      }
    );
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);

    changePassword.mutate(
      { old_password: oldPassword, new_password: newPassword },
      {
        onSuccess: (data) => {
          setPasswordMessage(data.detail || "Password updated successfully.");
          setOldPassword("");
          setNewPassword("");
        },
        onError: (err) => {
          setPasswordMessage(err.message || "Failed to change password.");
        },
      }
    );
  };

  if (userQuery.isLoading) {
    return <div className="container py-4">Loading profile...</div>;
  }

  if (userQuery.isError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          Failed to load profile. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1 className="h4 mb-4">My Profile</h1>

      {/* Profile info */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h6 mb-3">Account details</h2>

          {profileMessage && (
            <div className="alert alert-info py-2 small">
              {profileMessage}
            </div>
          )}

          <form onSubmit={handleProfileSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="card-body">
          <h2 className="h6 mb-3">Change password</h2>

          {passwordMessage && (
            <div className="alert alert-info py-2 small">
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="oldPassword">
                Current password
              </label>
              <input
                id="oldPassword"
                type="password"
                className="form-control"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="newPassword">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
