import { Container, Row, Col, Card } from "react-bootstrap";
import DashboardLayout from "../layouts/DashboardLayout";
import MonthCalendar from "../components/Calendar/MonthCalendar";

export default function CalendarPage() {
  return (
    <DashboardLayout>
      <Container className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold mb-0">Calendar</h2>
            <div className="text-muted">
              View and schedule tasks across your month.
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <MonthCalendar />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  );
}
