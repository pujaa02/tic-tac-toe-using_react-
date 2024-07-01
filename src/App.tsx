import React from "react";
import "./App.css";
import TicTacToe from "./Components/TicTacToe";
import Board from "./Components/game";

const App: React.FC = () => {
  return (
    <div className="App">
      <TicTacToe />
      <Board />
    </div>
  );
};

export default App;
