let avatarSelecionado = "../assets/profile/profile1.jpg";

// ================= AVATAR SELECTION =================
const avatarButtons = document.querySelectorAll(".avatar-option");
const previewImg = document.getElementById("preview");

avatarButtons.forEach((btn, index) => {
  // Marcar o primeiro como selecionado por padrão
  if (index === 0) {
    btn.classList.add("selected");
    btn.setAttribute("aria-pressed", "true");
  } else {
    btn.setAttribute("aria-pressed", "false");
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    
    // Remover seleção anterior
    avatarButtons.forEach(b => {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });

    // Adicionar seleção atual
    btn.classList.add("selected");
    btn.setAttribute("aria-pressed", "true");
    avatarSelecionado = btn.dataset.avatar;
    
    if (previewImg) {
      previewImg.src = avatarSelecionado;
    }
  });
});

// ================= FORM SUBMISSION =================
const formPerfil = document.getElementById("formPerfil");
if (formPerfil) {
  formPerfil.addEventListener("submit", function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value;

    if (!nome || nome.trim().length === 0) {
      console.error("Nome do perfil não pode estar vazio");
      return;
    }

    const perfil = {
      nome: nome,
      avatar: avatarSelecionado
    };

    // salva no navegador
    try {
      localStorage.setItem("perfil", JSON.stringify(perfil));
      // redireciona
      window.location.href = "../index.html";
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
    }
  });
}
