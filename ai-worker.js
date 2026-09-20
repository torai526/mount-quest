"use strict";

/*
 * マウントクエスト AI Worker
 *
 * index.htmlから受け取った局面を復元し、
 * 通常AIまたは絶対神の最善手を探索します。
 */

class WorkerRules {
  constructor(size, lines, counts) {
    this.n = size;
    this.k = size;
    this.lines = lines;
    this.counts = counts;
  }
}

class WorkerState {
  constructor(rules, board, reserves, turn) {
    this.rules = rules;
    this.board = board;
    this.reserves = reserves;
    this.turn = turn;
  }

  top(square) {
    const stack = this.board[square];
    const length = stack.length;

    return length > 0
      ? stack[length - 1]
      : null;
  }

  winners() {
    const winners = [];

    for (const line of this.rules.lines) {
      const firstStack = this.board[line[0]];
      const first =
        firstStack[firstStack.length - 1];

      if (!first) {
        continue;
      }

      let complete = true;

      for (
        let index = 1;
        index < line.length;
        index++
      ) {
        const stack = this.board[line[index]];
        const top = stack[stack.length - 1];

        if (
          !top ||
          top.player !== first.player
        ) {
          complete = false;
          break;
        }
      }

      if (
        complete &&
        !winners.some(
          (winner) =>
            winner.player === first.player
        )
      ) {
        winners.push({
          player: first.player,
          line: [...line]
        });
      }
    }

    return winners;
  }

  legal(move) {
    if (
      !Number.isInteger(move.dst) ||
      move.dst < 0 ||
      move.dst >= this.board.length ||
      move.size < 1 ||
      move.size > 3
    ) {
      return false;
    }

    const destinationStack =
      this.board[move.dst];

    const target =
      destinationStack[
        destinationStack.length - 1
      ];

    if (
      target &&
      move.size <= target.size
    ) {
      return false;
    }

    if (move.src === null) {
      return (
        this.reserves[this.turn][
          move.size - 1
        ] > 0
      );
    }

    if (
      !Number.isInteger(move.src) ||
      move.src < 0 ||
      move.src >= this.board.length ||
      move.src === move.dst
    ) {
      return false;
    }

    const sourceStack =
      this.board[move.src];

    const piece =
      sourceStack[sourceStack.length - 1];

    return Boolean(
      piece &&
      piece.player === this.turn &&
      piece.size === move.size
    );
  }

  apply(move) {
    /*
     * 盤面全体の駒を複製せず、
     * 変更されるマスだけを複製します。
     */

    const newBoard = this.board.slice();

    const newReserves = [
      this.reserves[0],
      this.reserves[1]
    ];

    newBoard[move.dst] =
      this.board[move.dst].slice();

    if (move.src === null) {
      newReserves[this.turn] =
        this.reserves[this.turn].slice();

      newReserves[this.turn][
        move.size - 1
      ]--;

      newBoard[move.dst].push({
        player: this.turn,
        size: move.size
      });
    } else {
      newBoard[move.src] =
        this.board[move.src].slice();

      const piece =
        newBoard[move.src].pop();

      newBoard[move.dst].push(piece);
    }

    return new WorkerState(
      this.rules,
      newBoard,
      newReserves,
      1 - this.turn
    );
  }

  moves() {
    const moves = [];
    const squareCount = this.board.length;

    for (let size = 1; size <= 3; size++) {
      if (
        this.reserves[this.turn][
          size - 1
        ] <= 0
      ) {
     
