// ===================================================================
//  댓글 기능 (누구나 로그인 없이 댓글 작성)
//  - 이 파일은 직접 고치지 않아도 돼요. 설정은 firebase-config.js 에서!
// ===================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where,
  orderBy, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const box = document.getElementById("comments");
const listEl = document.getElementById("comment-list");
const formEl = document.getElementById("comment-form");
const nameEl = document.getElementById("comment-name");
const textEl = document.getElementById("comment-text");
const statusEl = document.getElementById("comment-status");

const postId = box ? box.dataset.postId : "";

// 설정을 아직 안 한 경우(예시값 그대로)에는 안내만 보여주고 멈춤
function isConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("여기에");
}

if (!isConfigured()) {
  listEl.innerHTML = "";
  const notice = document.createElement("li");
  notice.className = "comment-loading";
  notice.textContent =
    "댓글 기능 준비 중이에요. (firebase-config.js 설정을 마치면 켜집니다)";
  listEl.appendChild(notice);
  if (formEl) formEl.style.display = "none";
} else {
  startComments();
}

function startComments() {
  let db;
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (e) {
    showError("댓글을 연결하지 못했어요. 설정값을 다시 확인해 주세요.");
    return;
  }

  loadComments(db);

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = nameEl.value.trim();
    const text = textEl.value.trim();

    if (!name) { setStatus("이름을 입력해 주세요."); return; }
    if (!text) { setStatus("댓글 내용을 입력해 주세요."); return; }

    setStatus("등록하는 중...");
    try {
      await addDoc(collection(db, "comments"), {
        postId: postId,
        name: name.slice(0, 30),
        text: text.slice(0, 800),
        createdAt: serverTimestamp()
      });
      textEl.value = "";
      setStatus("댓글이 등록되었어요!");
      loadComments(db);
    } catch (e) {
      setStatus("등록에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  });
}

async function loadComments(db) {
  try {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);

    listEl.innerHTML = "";
    if (snap.empty) {
      const empty = document.createElement("li");
      empty.className = "comment-loading";
      empty.textContent = "아직 댓글이 없어요. 첫 댓글을 남겨보세요!";
      listEl.appendChild(empty);
      return;
    }

    snap.forEach((doc) => {
      const c = doc.data();
      listEl.appendChild(renderComment(c));
    });
  } catch (e) {
    showError("댓글을 불러오지 못했어요. 잠시 후 새로고침 해보세요.");
  }
}

// 사용자가 쓴 글을 그대로 화면 코드에 넣지 않고 textContent로 안전하게 표시
function renderComment(c) {
  const li = document.createElement("li");
  li.className = "comment-item";

  const head = document.createElement("div");
  head.className = "comment-head";

  const nameSpan = document.createElement("span");
  nameSpan.className = "comment-author";
  nameSpan.textContent = c.name || "익명";

  const dateSpan = document.createElement("span");
  dateSpan.className = "comment-when";
  dateSpan.textContent = formatDate(c.createdAt);

  head.appendChild(nameSpan);
  head.appendChild(dateSpan);

  const body = document.createElement("div");
  body.className = "comment-body";
  body.textContent = c.text || "";

  li.appendChild(head);
  li.appendChild(body);
  return li;
}

function formatDate(ts) {
  if (!ts || !ts.toDate) return "";
  const d = ts.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }

function showError(msg) {
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "comment-loading";
  li.textContent = msg;
  listEl.appendChild(li);
}
