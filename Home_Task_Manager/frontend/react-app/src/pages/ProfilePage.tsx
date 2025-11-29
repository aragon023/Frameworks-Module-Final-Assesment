import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import { useCurrentUser } from "../hooks/useCurrentUser";

const ProfilePage: React.FC = () => {
  const { userQuery, updateUser, changePassword } = useCurrentUser();
  const user = userQuery.data;

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [username, setUsername] = useState(user?.username ?? "");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Keep local form state in sync when user data loads/refetches
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? "");
      setLastName(user.last_name ?? "");
      setEmail(user.email ?? "");
      setUsername(user.username ?? "");
    }
  }, [user]);

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setProfileMessage(null);
    setProfileError(null);

    updateUser.mutate(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        username,
      },
      {
        onSuccess: () => {
          setProfileMessage("Profile updated successfully.");
        },
        onError: (err) => {
          setProfileError(err.message || "Failed to update profile.");
        },
      }
    );
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!oldPassword || !newPassword) {
      setPasswordError("Please fill in both password fields.");
      return;
    }

    changePassword.mutate(
      { old_password: oldPassword, new_password: newPassword },
      {
        onSuccess: (data) => {
          setPasswordMessage(data.detail || "Password changed successfully.");
          setOldPassword("");
          setNewPassword("");
        },
        onError: (err) => {
          setPasswordError(err.message || "Failed to change password.");
        },
      }
    );
  };

  if (userQuery.isLoading) {
    return (
      <DashboardLayout>
        <div className="d-flex justify-content-center align-items-center py-5">
          <Spinner animation="border" />
        </div>
      </DashboardLayout>
    );
  }

  if (userQuery.isError || !user) {
    return (
      <DashboardLayout>
        <Container className="py-4">
          <Alert variant="danger">
            Failed to load profile. Please try refreshing the page or logging in
            again.
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  const rawName =
    (user.first_name && user.first_name.trim()) ||
    (user.username && user.username.trim()) ||
    "";
  const displayName =
    rawName.length > 0
      ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
      : "there";

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-3">
          <Col>
            <h2 className="fw-bold mb-1">Profile</h2>
            <p className="text-muted mb-0">
              Manage your account details and update your password.
            </p>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Profile details */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fw-semibold mb-3">
                  Welcome, {displayName}
                </Card.Title>

                <Form onSubmit={handleProfileSubmit}>
                  <Form.Group className="mb-3" controlId="profileFirstName">
                    <Form.Label>First name</Form.Label>
                    <Form.Control
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. James"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="profileLastName">
                    <Form.Label>Last name</Form.Label>
                    <Form.Control
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Smith"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="profileEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="profileUsername">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your username"
                    />
                  </Form.Group>

                  {profileError && (
                    <Alert variant="danger" className="mt-2">
                      {profileError}
                    </Alert>
                  )}
                  {profileMessage && (
                    <Alert variant="success" className="mt-2">
                      {profileMessage}
                    </Alert>
                  )}

                  <div className="d-flex justify-content-end mt-3">
                    <Button
                      type="submit"
                      variant="success" 
                      disabled={updateUser.isPending}
                    >
                      {updateUser.isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Password change */}
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title className="fw-semibold mb-3">
                  Change password
                </Card.Title>

                <Form onSubmit={handlePasswordSubmit}>
                  <Form.Group className="mb-3" controlId="oldPassword">
                    <Form.Label>Current password</Form.Label>
                    <Form.Control
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>New password</Form.Label>
                    <Form.Control
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                  </Form.Group>

                  {passwordError && (
                    <Alert variant="danger" className="mt-2">
                      {passwordError}
                    </Alert>
                  )}
                  {passwordMessage && (
                    <Alert variant="success" className="mt-2">
                      {passwordMessage}
                    </Alert>
                  )}

                  <div className="d-flex justify-content-end mt-3">
                    <Button
                      type="submit"
                      variant="success" 
                      disabled={changePassword.isPending}
                    >
                      {changePassword.isPending ? "Updating..." : "Update password"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
};

export default ProfilePage;
