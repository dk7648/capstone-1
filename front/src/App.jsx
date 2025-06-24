import { createContext, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Nav, Navbar, Container, Row, Col } from "react-bootstrap";
import { Routes, Route, useNavigate, Outlet } from "react-router-dom";
import data from "./data.js";
import Detail from "./routes/detail.jsx";
import Cart from "./routes/Cart.jsx";
import "./App.css";

export let Context1 = createContext();

function App() {
  let [products] = useState(data);
  let [재고] = useState([10, 11, 12]);
  let [loading] = useState(false);
  let navigate = useNavigate();

  return (
    <div className="App">
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand onClick={() => navigate("/")}>Capstone</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate("/")}>Home</Nav.Link>
            <Nav.Link onClick={() => navigate("/about")}>About</Nav.Link>
            <Nav.Link onClick={() => navigate("/cart")}>Cart</Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Routes>
        <Route
          path="/"
          element={
            <>
              {loading && <div className="alert alert-warning">로딩중</div>}

              <div className="main-bg"></div>
              <Container>
                <Row>
                  {products.map((target, i) => (
                    <Col sm key={i}>
                      <Card product={target} />
                    </Col>
                  ))}
                </Row>
              </Container>
              
            </>
          }
        />
        <Route
          path="/detail/:id"
          element={
            <Context1.Provider value={{ 재고 }}>
              <Detail products={products} />
            </Context1.Provider>
          }
        />
        <Route path="/about" element={<About />}>
          <Route path="member" element={<h4>회사 멤버</h4>} />
          <Route path="location" element={<h4>회사 위치</h4>} />
        </Route>

        <Route path="/cart" element={<Cart />} />

        <Route
          path="/event"
          element={
            <div>
              <h4>오늘의 이벤트</h4>
              <Outlet />
            </div>
          }
        >
          <Route path="one" element={<h4>첫 주문시 서비스</h4>} />
          <Route path="two" element={<h4>생일 기념 쿠폰 받기</h4>} />
        </Route>

        <Route path="*" element={<>없는 페이지입니다.</>} />
      </Routes>
    </div>
  );
}

function About() {
  return (
    <div>
      <h4>회사정보</h4>
      <Outlet />
    </div>
  );
}

function Card(props) {
  return (
    <div>
      <a href={"/detail/" + props.product.id}>
        <img
          src={
            "/cat.jpg"
          }
          width="80%"
          alt="상품 이미지"
        />
        <h4>{props.product.title}</h4>
      </a>
      <p>{props.product.content}</p>
      <p>{props.product.price}</p>
    </div>
  );
}

export default App;
