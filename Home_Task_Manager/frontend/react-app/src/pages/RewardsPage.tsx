import { useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
} from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import { useRewardsSummary, useRedeemRewards } from "../hooks/useRewards";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function RewardsPage() {
  const { userQuery } = useCurrentUser();
  const isChild = userQuery.data?.role === "child";
  const { data, isLoading, error } = useRewardsSummary();
  const redeemRewards = useRedeemRewards();
  const isRedeeming = redeemRewards.isPending;

  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleRedeem = async (event: FormEvent) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const pointsValue = Number(points);
    if (!Number.isFinite(pointsValue) || pointsValue <= 0) {
      setErrorMessage("Enter a valid number of points to redeem.");
      return;
    }

    try {
      await redeemRewards.mutateAsync({
        points: pointsValue,
        note: note.trim() ? note.trim() : undefined,
      });
      setSuccessMessage("Rewards redeemed successfully.");
      setPoints("");
      setNote("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to redeem rewards.";
      setErrorMessage(message);
    }
  };

  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold mb-0">Rewards</h2>
            <div className="text-muted">Track points and redeem household rewards.</div>
          </Col>
        </Row>

        {isLoading ? (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <Alert variant="danger">Failed to load rewards summary.</Alert>
        ) : (
          <>
            <Row className="g-3">
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title className="text-muted">My Points</Card.Title>
                    <div className="display-6 fw-bold">{data?.my_points ?? 0}</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title className="text-muted">Household Total</Card.Title>
                    <div className="display-6 fw-bold">
                      {data?.household_total_points ?? 0}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>Redeem Points</Card.Title>
                    {isChild && (
                      <Alert variant="warning" className="small">
                        Children can view points but cannot redeem rewards.
                      </Alert>
                    )}
                    {successMessage && <Alert variant="success">{successMessage}</Alert>}
                    {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                    <Form onSubmit={handleRedeem}>
                      <Form.Group className="mb-2">
                        <Form.Label className="small text-muted">Points</Form.Label>
                        <Form.Control
                          type="number"
                          min={1}
                          value={points}
                          onChange={(e) => setPoints(e.target.value)}
                          disabled={isChild || isRedeeming}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label className="small text-muted">Note (optional)</Form.Label>
                        <Form.Control
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          disabled={isChild || isRedeeming}
                        />
                      </Form.Group>
                      <Button
                        type="submit"
                        variant="success"
                        disabled={isChild || isRedeeming}
                      >
                        {isRedeeming ? "Redeeming..." : "Redeem"}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mt-4">
              <Col md={6}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>Leaderboard</Card.Title>
                    <ListGroup variant="flush">
                      {(data?.leaderboard ?? []).map((entry, index) => (
                        <ListGroup.Item
                          key={entry.id}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <span className="fw-semibold me-2">#{index + 1}</span>
                            {entry.name}{" "}
                            <span className="text-muted small">({entry.role})</span>
                          </div>
                          <span className="fw-semibold">{entry.points}</span>
                        </ListGroup.Item>
                      ))}
                      {data?.leaderboard?.length === 0 && (
                        <ListGroup.Item className="text-muted">
                          No points yet.
                        </ListGroup.Item>
                      )}
                    </ListGroup>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </DashboardLayout>
  );
}
