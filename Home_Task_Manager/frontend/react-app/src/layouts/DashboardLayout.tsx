import { useState } from "react";
import type { ReactNode } from "react";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import { useMembers } from "../hooks/useMembers";
import { useNavigate } from "react-router-dom";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const { data: members, isLoading, error } = useMembers(1);
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
};


  return (
    <div className="min-vh-100 bg-light">
      {/* Mobile top bar */}
      <div className="d-md-none d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
        <Button variant="outline-secondary" onClick={() => setShowSidebar(true)}>☰</Button>
        <div className="fw-bold">FamFlow</div>
        <div style={{ width: 36 }} />
      </div>

      <Container fluid>
        <Row>
          <Col md={3} lg={2} className="d-none d-md-block border-end bg-white min-vh-100 p-3">
            <div className="fw-bold fs-5 mb-3">HomeTasker</div>
            <div className="mb-3">
              <div className="text-muted small">Household</div>
              <div className="fw-semibold">Aragon Family</div>
            </div>

            <div className="d-grid gap-2 mb-3">
              <Button variant="light" className="text-start" href="/">🏠 Dashboard</Button>
              <Button variant="light" className="text-start" href="/tasks">📋 Tasks</Button>
              <Button variant="light" className="text-start" href="/categories">🗂️ Categories</Button>
              <Button variant="light" className="text-start" href="/members">👨‍👩‍👧 Family</Button>
              <Button variant="light" className="text-start" href="/pets">🐾 Pets</Button>
              <Button variant="light" className="text-start">📅 Calendar</Button>
              <Button variant="light" className="text-start">⭐ Rewards</Button>
              <Button variant="light" className="text-start">⚙️ Settings</Button>
            </div>


            <div className="text-muted small mb-2">Family</div>
            {isLoading ? (
              <div className="py-2 text-center"><Spinner animation="border" size="sm" /></div>
            ) : error ? (
              <div className="text-danger small mb-2">Failed to load members.</div>
            ) : (
              <div className="d-grid gap-2">
                {(members ?? []).map(m => (
                  <div key={m.id} className="d-flex align-items-center gap-2">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.name} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                    ) : (
                      <span className="rounded-circle bg-secondary-subtle d-inline-flex justify-content-center align-items-center"
                            style={{ width: 32, height: 32 }}>
                        {m.name?.[0] ?? "•"}
                      </span>
                    )}
                    {m.name}
                  </div>
                ))}
                {(!members || members.length === 0) && (
                  <div className="text-muted">No members yet</div>
                )}
              </div>
            )}

            <Button variant="success" className="w-100 mt-3">Invite Member</Button>
          </Col>

          <Col xs={12} md={9} lg={10} className="p-3">
            <div className="d-flex justify-content-end mb-3">
              <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </div>
            {children}
          </Col>
        </Row>
      </Container>

      {/* Mobile Offcanvas */}
      <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} householdId={1} />
    </div>
  );
}
