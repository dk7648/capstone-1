import { Table } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { modifyCount, removeItem } from "../store/cartSlice.jsx";

function Cart() {
  // cart 슬라이스 상태 가져오기
  const cart = useSelector((state) => state.cart);
  const dispatch = useDispatch();

  return (
    <>
      <h3 style={{ margin: "20px 0" }}>🛒 장바구니</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>상품명</th>
            <th>수량</th>
            <th>변경</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((product, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{product.name}</td>
              <td>{product.count}</td>
              <td>
                <button
                  onClick={() =>
                    dispatch(modifyCount({ target: product, step: 1 }))
                  }
                >
                  +
                </button>{" "}
                <button
                  onClick={() =>
                    dispatch(modifyCount({ target: product, step: -1 }))
                  }
                >
                  -
                </button>
              </td>
              <td>
                <button onClick={() => dispatch(removeItem(product))}>
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

export default Cart;
