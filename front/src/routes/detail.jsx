import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { Nav } from "react-bootstrap";
import { Context1 } from "./../App.jsx";
import { useDispatch } from "react-redux";
import { push } from "../store/cartSlice.jsx";

function Detail(props) {
  let [input, setInput] = useState("");
  let [alert, setAlert] = useState(true);
  let [tap, setTap] = useState(0);
  let [fade, setFade] = useState("");

  let { id } = useParams();
  let product = props.products.find((e) => e.id == id);

  let dispatch = useDispatch();
  let context = useContext(Context1);

  useEffect(() => {
    let timer = setTimeout(() => {
      setAlert(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (input !== "" && isNaN(input)) {
      alert("숫자만 입력하세요");
    }
  }, [input]);

  useEffect(() => {
    let timer = setTimeout(() => setFade("end"), 10);
    return () => {
      setFade("");
      clearTimeout(timer);
    };
  }, [tap]);

  useEffect(() => {
    let watched = localStorage.getItem("watched");
    watched = watched ? JSON.parse(watched) : [];
    if (!watched.includes(id)) watched.push(id);
    localStorage.setItem("watched", JSON.stringify(watched));
  }, [id]);

  return (
    <div className={"container start " + fade}>
      {alert && (
        <div className="alert alert-warning">2초 이내 구매 시 할인</div>
      )}
      <div className="row">
        <div className="col-md-6">
          <img
            src={
            "/cat.jpg"
          }
            width="100%"
            alt="상품 이미지"
          />
        </div>
        <div className="col-md-6">
          <input
            type="text"
            onChange={(e) => setInput(e.target.value)}
            placeholder="수량 입력"
          />
          <h4 className="pt-5">{product.title}</h4>
          <p>{product.content}</p>
          <p>{product.price}원</p>
          <button
            onClick={() =>
              dispatch(push({ id: product.id, name: product.title, count: 1 }))
            }
            className="btn btn-danger"
          >
            주문하기
          </button>
          <p>남은 재고: {context.재고[product.id] ?? "알 수 없음"}</p>
        </div>
      </div>

      <Nav variant="tabs" defaultActiveKey="link0">
        <Nav.Item>
          <Nav.Link eventKey="link0" onClick={() => setTap(0)}>
            상품 정보
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="link1" onClick={() => setTap(1)}>
            상품 설명
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="link2" onClick={() => setTap(2)}>
            구매 후기
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <TapContent tap={tap} />
    </div>
  );
}

function TapContent({ tap }) {
  let [fade, setFade] = useState("");
  useEffect(() => {
    let timer = setTimeout(() => setFade("end"), 10);
    return () => {
      setFade("");
      clearTimeout(timer);
    };
  }, [tap]);

  const content = [
    <div>상품 정보입니다.</div>,
    <div>상품 설명입니다.</div>,
    <div>구매 후기입니다.</div>,
  ];

  return <div className={"start " + fade}>{content[tap]}</div>;
}

export default Detail;
