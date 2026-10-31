(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.EPChess = api;
})(typeof window !== "undefined" ? window : global, function () {
  const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

  function row(i) { return Math.floor(i / 8); }
  function col(i) { return i % 8; }
  function sq(r, c) { return r * 8 + c; }
  function on(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

  function start() {
    const back = ["r", "n", "b", "q", "k", "b", "n", "r"];
    const board = Array(64).fill(null);
    for (let c = 0; c < 8; c++) {
      board[c] = "b" + back[c];
      board[8 + c] = "bp";
      board[48 + c] = "wp";
      board[56 + c] = "w" + back[c];
    }
    return {
      board: board,
      turn: "w",
      castle: { wK: true, wQ: true, bK: true, bQ: true },
      ep: null,
      last: null
    };
  }

  function attacked(board, index, by) {
    const r = row(index);
    const c = col(index);
    const pr = r + (by === "w" ? 1 : -1);
    for (let dc = -1; dc <= 1; dc += 2) {
      if (on(pr, c + dc) && board[sq(pr, c + dc)] === by + "p") return true;
    }
    for (let i = 0; i < KNIGHT.length; i++) {
      const rr = r + KNIGHT[i][0];
      const cc = c + KNIGHT[i][1];
      if (on(rr, cc) && board[sq(rr, cc)] === by + "n") return true;
    }
    for (let i = 0; i < KING.length; i++) {
      const rr = r + KING[i][0];
      const cc = c + KING[i][1];
      if (on(rr, cc) && board[sq(rr, cc)] === by + "k") return true;
    }
    const rays = ROOK.concat(BISHOP);
    for (let i = 0; i < rays.length; i++) {
      const dr = rays[i][0];
      const dc = rays[i][1];
      const diagonal = dr !== 0 && dc !== 0;
      let rr = r + dr;
      let cc = c + dc;
      while (on(rr, cc)) {
        const piece = board[sq(rr, cc)];
        if (piece) {
          if (piece[0] === by) {
            const kind = piece[1];
            if (kind === "q" || kind === (diagonal ? "b" : "r")) return true;
          }
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
    return false;
  }

  function kingAt(board, color) {
    const code = color + "k";
    for (let i = 0; i < 64; i++) if (board[i] === code) return i;
    return -1;
  }

  function inCheck(board, color) {
    const index = kingAt(board, color);
    return index >= 0 && attacked(board, index, color === "w" ? "b" : "w");
  }

  function push(moves, from, to, promo) {
    moves.push({ from: from, to: to, promo: promo });
  }

  function addPawn(moves, from, to, promote) {
    if (!promote) push(moves, from, to, null);
    else {
      push(moves, from, to, "q");
      push(moves, from, to, "r");
      push(moves, from, to, "b");
      push(moves, from, to, "n");
    }
  }

  function slide(board, moves, from, r, c, color, dirs) {
    for (let i = 0; i < dirs.length; i++) {
      let rr = r + dirs[i][0];
      let cc = c + dirs[i][1];
      while (on(rr, cc)) {
        const to = sq(rr, cc);
        const occ = board[to];
        if (!occ) push(moves, from, to, null);
        else {
          if (occ[0] !== color) push(moves, from, to, null);
          break;
        }
        rr += dirs[i][0];
        cc += dirs[i][1];
      }
    }
  }

  function castleOk(state, color, side) {
    const key = color + (side === "k" ? "K" : "Q");
    if (!state.castle[key]) return false;
    const king = color === "w" ? 60 : 4;
    const step = side === "k" ? 1 : -1;
    const rook = king + (side === "k" ? 3 : -4);
    const opp = color === "w" ? "b" : "w";
    for (let cursor = king + step; cursor !== rook; cursor += step) {
      if (state.board[cursor]) return false;
    }
    if (attacked(state.board, king, opp)) return false;
    if (attacked(state.board, king + step, opp)) return false;
    if (attacked(state.board, king + step * 2, opp)) return false;
    return true;
  }

  function pseudo(state) {
    const board = state.board;
    const color = state.turn;
    const moves = [];
    const dir = color === "w" ? -1 : 1;
    const home = color === "w" ? 6 : 1;
    const last = color === "w" ? 0 : 7;
    for (let index = 0; index < 64; index++) {
      const piece = board[index];
      if (!piece || piece[0] !== color) continue;
      const r = row(index);
      const c = col(index);
      const kind = piece[1];
      if (kind === "p") {
        const nr = r + dir;
        if (on(nr, c) && !board[sq(nr, c)]) {
          addPawn(moves, index, sq(nr, c), nr === last);
          if (r === home && !board[sq(r + dir * 2, c)]) push(moves, index, sq(r + dir * 2, c), null);
        }
        for (let dc = -1; dc <= 1; dc += 2) {
          if (!on(nr, c + dc)) continue;
          const to = sq(nr, c + dc);
          const occ = board[to];
          if (to === state.ep || (occ && occ[0] !== color)) addPawn(moves, index, to, nr === last);
        }
      } else if (kind === "n") {
        for (let i = 0; i < KNIGHT.length; i++) {
          const rr = r + KNIGHT[i][0];
          const cc = c + KNIGHT[i][1];
          if (!on(rr, cc)) continue;
          const occ = board[sq(rr, cc)];
          if (!occ || occ[0] !== color) push(moves, index, sq(rr, cc), null);
        }
      } else if (kind === "k") {
        for (let i = 0; i < KING.length; i++) {
          const rr = r + KING[i][0];
          const cc = c + KING[i][1];
          if (!on(rr, cc)) continue;
          const occ = board[sq(rr, cc)];
          if (!occ || occ[0] !== color) push(moves, index, sq(rr, cc), null);
        }
        if (castleOk(state, color, "k")) push(moves, index, index + 2, null);
        if (castleOk(state, color, "q")) push(moves, index, index - 2, null);
      } else if (kind === "r") slide(board, moves, index, r, c, color, ROOK);
      else if (kind === "b") slide(board, moves, index, r, c, color, BISHOP);
      else slide(board, moves, index, r, c, color, ROOK.concat(BISHOP));
    }
    return moves;
  }

  function dropCastle(castle, from, to) {
    const next = {
      wK: castle.wK, wQ: castle.wQ, bK: castle.bK, bQ: castle.bQ
    };
    const spots = {
      60: ["wK", "wQ"],
      4: ["bK", "bQ"],
      63: ["wK"],
      56: ["wQ"],
      7: ["bK"],
      0: ["bQ"]
    };
    [from, to].forEach(function (index) {
      const keys = spots[index];
      if (!keys) return;
      for (let i = 0; i < keys.length; i++) next[keys[i]] = false;
    });
    return next;
  }

  function apply(state, move) {
    const board = state.board.slice();
    const piece = board[move.from];
    const color = piece[0];
    board[move.from] = null;
    board[move.to] = color + (move.promo || piece[1]);
    if (piece[1] === "p" && move.to === state.ep) {
      board[color === "w" ? move.to + 8 : move.to - 8] = null;
    }
    if (piece[1] === "k" && Math.abs(move.to - move.from) === 2) {
      const rookFrom = move.to > move.from ? move.from + 3 : move.from - 4;
      const rookTo = move.to > move.from ? move.from + 1 : move.from - 1;
      board[rookTo] = board[rookFrom];
      board[rookFrom] = null;
    }
    return {
      board: board,
      turn: color === "w" ? "b" : "w",
      castle: dropCastle(state.castle, move.from, move.to),
      ep: piece[1] === "p" && Math.abs(move.to - move.from) === 16 ? (move.from + move.to) / 2 : null,
      last: { from: move.from, to: move.to }
    };
  }

  function legalMoves(state) {
    const moves = pseudo(state);
    const keep = [];
    for (let i = 0; i < moves.length; i++) {
      const next = apply(state, moves[i]);
      if (!inCheck(next.board, state.turn)) keep.push(moves[i]);
    }
    return keep;
  }

  function statusOf(state, moves) {
    const check = inCheck(state.board, state.turn);
    if (moves.length) return check ? "check" : "play";
    return check ? "mate" : "stalemate";
  }

  function inspect(state) {
    const moves = legalMoves(state);
    return { moves: moves, status: statusOf(state, moves) };
  }

  function leaf(state) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const piece = state.board[i];
      if (!piece) continue;
      let value = VAL[piece[1]];
      const file = 4 - Math.abs(col(i) - 3.5);
      const stepped = piece[0] === "w" ? 7 - row(i) : row(i);
      if (piece[1] === "p") value += stepped * 4 + file * 5;
      else if (piece[1] === "n") value += file * 8 + (stepped ? 14 : 0);
      else if (piece[1] === "b") value += stepped ? 12 + file : 0;
      else if (piece[1] === "k") value += stepped ? -18 : 0;
      score += piece[0] === "w" ? value : -value;
    }
    return (state.turn === "w" ? 1 : -1) * score;
  }

  function rankMove(state, move) {
    const victim = state.board[move.to];
    let score = victim ? VAL[victim[1]] : 0;
    if (move.promo === "q") score += 800;
    else if (move.promo) score += 300;
    return score;
  }

  function ordered(state, moves) {
    return moves.slice().sort(function (a, b) {
      return rankMove(state, b) - rankMove(state, a);
    });
  }

  function search(state, depth, alpha, beta) {
    const moves = legalMoves(state);
    const status = statusOf(state, moves);
    if (status === "mate") return -24000;
    if (status === "stalemate") return 0;
    if (depth === 0) return leaf(state);
    const list = ordered(state, moves);
    let best = -Infinity;
    for (let i = 0; i < list.length; i++) {
      const score = -search(apply(state, list[i]), depth - 1, -beta, -alpha);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }

  function choose(state) {
    const list = ordered(state, legalMoves(state));
    if (!list.length) return null;
    let best = list[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    for (let i = 0; i < list.length; i++) {
      const score = -search(apply(state, list[i]), 1, -Infinity, -alpha);
      if (score > bestScore) {
        bestScore = score;
        best = list[i];
      }
      if (score > alpha) alpha = score;
    }
    return best;
  }

  const SHAPES = {
    p: '<path d="M22.5 10a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm-4.2 11.2c1.6 1 3 1.2 4.2.6 1.2.6 2.6.4 4.2-.6 1.2 3.2.6 7.4-.2 10.2h-8c-.8-2.8-1.4-7-.2-10.2zM14 34.2h17l2.2 4.2H11.8z"/>',
    r: '<path d="M12 8h5.2v4.2h3.2V8h4.2v4.2H28V8h5.2v7.4H12zm2.2 7.4h16.6V30H14.2zM11 31.4h23l2.2 5H8.8z"/>',
    n: '<path d="M33 36.5c-1-1.6-8-2.4-12.2-2.2-5.2.2-8.4-2.2-7.6-6.4.6-3.2 3.6-4.2 2.2-8.2-1.2-3.4.2-6.6 3.2-8.2 1.6-2.6 5.4-3.4 7.6-1.4.6 2.2 2.4 2.8 3.4 1.6l3.6-2.2c1.8 1.4 3.2 4 2.4 6.6 2.6.8 4.2 3.4 3.2 6.2-1.2 3.4-4.4 4.2-7.2 3.2-.6 3.4-1.2 5.6-4.6 8.2 3.4.4 6.6 1.2 6 2.8z"/><circle class="mark" cx="28.2" cy="16.2" r="1.35"/>',
    b: '<path d="M22.5 5.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM22.5 11c4.6 1.6 8 7.2 8 13.2H14.5C14.5 18.2 17.9 12.6 22.5 11zM16 26.6h13l1.6 3.2H14.4zM12.6 32.2h19.8l2.2 5H10.4z"/><path class="mark" d="M21.3 13.2h2.4v8.4h-2.4z"/>',
    q: '<circle cx="8.4" cy="13.2" r="2.45"/><circle cx="15.6" cy="8.6" r="2.45"/><circle cx="22.5" cy="6.4" r="2.45"/><circle cx="29.4" cy="8.6" r="2.45"/><circle cx="36.6" cy="13.2" r="2.45"/><path d="M8.2 15.6l5.6 14.6h17.4l5.6-14.6-6.6 4.4L22.5 12.2l-7.7 7.8z"/><path d="M13.4 31.8h18.2l2.4 5.2H11z"/>',
    k: '<path d="M20.2 2.2h4.6V6h3.8v4.2h-3.8v2.6h-4.6v-2.6h-3.8V6h3.8z"/><path d="M22.5 12.6c4.2 0 8.4 2.2 9.6 6.4l2.2 13.2H10.7l2.2-13.2c1.2-4.2 5.4-6.4 9.6-6.4z"/><path d="M12.4 32.6h20.2l2.4 5.2H10z"/>'
  };

  function pieceSvg(code) {
    return '<svg class="cp" viewBox="0 0 45 45" aria-hidden="true">' + SHAPES[code[1]] + "</svg>";
  }

  return {
    start: start,
    apply: apply,
    legalMoves: legalMoves,
    inspect: inspect,
    choose: choose,
    inCheck: inCheck,
    attacked: attacked,
    pieceSvg: pieceSvg
  };
});
