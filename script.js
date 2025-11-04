import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgryecBphpQEcMax0BU5lNcUNCVQzkuGQ",
  authDomain: "mylove-taskmanager.firebaseapp.com",
  projectId: "mylove-taskmanager",
  storageBucket: "mylove-taskmanager.firebasestorage.app",
  messagingSenderId: "396463835279",
  appId: "1:396463835279:web:25c86ce5be493b16ef88fa",
  measurementId: "G-RQY2PDGD0E",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let tasks = [];
let editingTaskId = null;
let unsubscribe = null;

// Loading overlay
function showLoading() {
  document.getElementById("loadingOverlay").classList.add("active");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("active");
}

// Screen navigation
window.showScreen = function (screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
};

window.showQuestion = function () {
  showScreen("question");
};

window.showAddTask = function () {
  if (tasks.length === 0) {
    showScreen("addTaskEmpty");
  } else {
    showScreen("addTaskHas");
  }
};

window.showTaskList = function () {
  showScreen("taskList");
};

// Initialize - Load tasks from Firestore
async function startApp() {
  showLoading();

  // Real-time listener for tasks
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      tasks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderTasks();
      hideLoading();
    },
    (error) => {
      console.error("Error loading tasks:", error);
      hideLoading();
      alert("Gagal memuat data tugas. Coba refresh halaman ya sayang!");
    }
  );

  window.showTaskList = function () {
    showScreen("taskList");
    renderTasks();
  };

  setTimeout(() => {
    showScreen("question");
  }, 3000);
}

async function handleFormSubmit(formId, submitBtnId) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById(submitBtnId);

    const inputs = form.querySelectorAll("input[required], select[required]");
    let valid = true;
    inputs.forEach((input) => {
      if (!input.value) valid = false;
    });

    if (!valid) {
      Swal.fire({
        icon: "warning",
        title: "Upss...",
        text: "Sayang, semua field harus diisi dulu yaaa",
      });
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    try {
      const task = {
        name: form.querySelector('input[id^="taskName"]').value,
        detail: form.querySelector('input[id^="taskDetail"]').value,
        subject: form.querySelector('select[id^="subject"]').value,
        deadline: form.querySelector('input[type="date"]').value,
        type: form.querySelector('input[type="radio"]:checked').value,
        createdAt: serverTimestamp(),
      };

      if (editingTaskId && formId === "taskForm") {
        await updateDoc(doc(db, "tasks", editingTaskId), task);
        editingTaskId = null;
      } else {
        await addDoc(collection(db, "tasks"), task);
      }

      form.reset();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Tugas berhasil disimpan sayaang",
        timer: 1500,
        showConfirmButton: false,
      });

      showTaskList();
    } catch (error) {
      console.error("Error saving task:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: "Gagal menyimpan tugas. Cobaa lagii yaa sayang",
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Bikin Catatan";
    }
  });
}

handleFormSubmit("taskForm", "submitBtn");
handleFormSubmit("taskForm2", "submitBtn2");

function renderTasks() {
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  if (tasks.length === 0) {
    container.innerHTML = `
                    <div class="empty-state">
                        <h3>Belum adaa tugass nii sayaang</h3>
                        <p>Yeeayy! Kamuu bebass duluu sayaaang</p>
                    </div>
                `;
    return;
  }

  tasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.innerHTML = `
                    <div class="task-content">
                        <div class="task-left">
                            <h2 class="task-info"> ${task.subject} </h2>
                            <div class="task-info"> ${task.deadline} </div>
                            <div class="task-info"> ${task.name} </div>
                            <div class="task-info"> ${task.type} </div>
                            <div class="task-info"> ${task.detail} </div>
                        </div>
                        <div class="task-actions">
                            <button class="action-btn btn-complete" onclick="completeTask('${task.id}')">✓</button>
                            <button class="action-btn btn-delete" onclick="deleteTask('${task.id}')">✕</button>
                            <button class="action-btn btn-edit" onclick="editTask('${task.id}')">✎</button>
                        </div>
                    </div>
                `;
    container.appendChild(taskCard);
  });
}

window.completeTask = async function (id) {
  const result = await Swal.fire({
    title: "Udah Selesai Sayangg??",
    text: "Kamu cek lagi ya untuk memastikan selesai ❤️",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sudah Sayang",
    cancelButtonText: "Belum Sayang",
  });

  if (!result.isConfirmed) return;

  showLoading();
  try {
    await deleteDoc(doc(db, "tasks", id));
    Swal.fire(
      "YEAAY KEREEN!",
      "Tugas Sudaa selesaai, Kamu hebatt 💖",
      "success"
    );
  } catch (error) {
    console.error("Error completing task:", error);
    Swal.fire("Gagal!", "Gagal menyelesaikan tugas. Coba lagi 😢", "error");
  } finally {
    hideLoading();
  }
};

window.deleteTask = async function (id) {
  const result = await Swal.fire({
    title: "Hapus tugas?",
    text: "Yakin mau hapus tugas ini sayang? 😢",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Iya, hapus!",
    cancelButtonText: "Batal",
  });

  if (!result.isConfirmed) return;

  showLoading();
  try {
    await deleteDoc(doc(db, "tasks", id));
    Swal.fire("Terhapus!", "Tugas berhasil dihapus 💔", "success");
  } catch (error) {
    console.error("Error deleting task:", error);
    Swal.fire("Gagal!", "Gagal menghapus tugas. Coba lagi 😢", "error");
  } finally {
    hideLoading();
  }
};

window.editTask = function (id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingTaskId = id;

  document.getElementById("taskName").value = task.name;
  document.getElementById("taskDetail").value = task.detail;
  document.getElementById("subject").value = task.subject;
  document.getElementById("deadline").value = task.deadline;
  document.querySelector(
    `input[name="taskType"][value="${task.type}"]`
  ).checked = true;

  showScreen("addTaskEmpty");
};

startApp();
