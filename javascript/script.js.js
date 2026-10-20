/* ==========================================================================
   ARCHIVO: javascript/script.js (Conserva Interacciones.js + Funciones comunes)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {

    /* 1. INTERACTIVIDAD DE BOTONES AZULES (Tu código de Interacciones.js) */
    const botones = document.querySelectorAll('.btn-azul');
    botones.forEach(boton => {
        boton.style.transition = "transform 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease";
        boton.addEventListener('mouseenter', () => {
            boton.style.transform = "scale(1.08)";
            boton.style.filter = "brightness(1.2)";
            boton.style.boxShadow = "0 15px 30px rgba(0, 210, 255, 0.5)";
        });
        boton.addEventListener('mouseleave', () => {
            boton.style.transform = "scale(1)";
            boton.style.filter = "brightness(1)";
            boton.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.4)";
        });
    });

    /* 2. INTERACTIVIDAD DE TARJETA PRINCIPAL E HERO */
    const tarjetasPrincipales = document.querySelectorAll('.tarjeta-info, .hero-section');
    tarjetasPrincipales.forEach(tarjeta => {
        tarjeta.style.transition = "transform 0.4s ease, box-shadow 0.4s ease";
        tarjeta.addEventListener('mouseenter', () => {
            tarjeta.style.transform = "scale(1.01)";
        });
        tarjeta.addEventListener('mouseleave', () => {
            tarjeta.style.transform = "scale(1)";
        });
    });

    /* 3. ENLACES DEL HEADER Y MARCADO DE PÁGINA ACTIVA */
    const enlacesMenu = document.querySelectorAll('header .enlaces-menu a:not(.btn-login-menu)');
    const paginaActual = window.location.pathname.split('/').pop() || 'index.html';

    enlacesMenu.forEach(enlace => {
        if (enlace.getAttribute('href') === paginaActual) {
            enlace.classList.add('activo');
        }
        enlace.addEventListener('mouseenter', () => { enlace.style.color = "#00d2ff"; });
        enlace.addEventListener('mouseleave', () => {
            enlace.style.color = enlace.classList.contains('activo') ? "#38bdf8" : "#ffffff";
        });
    });

    /* 4. EFECTO SUAVE EN TARJETAS DE CONTENIDO */
    const tarjetas = document.querySelectorAll('.pilar-card, .card-miembro');
    tarjetas.forEach(card => {
        card.style.transition = "transform 0.3s ease";
        card.addEventListener('mouseenter', () => { card.style.transform = "translateY(-5px)"; });
        card.addEventListener('mouseleave', () => { card.style.transform = "translateY(0)"; });
    });

    /* 5. CONFIRMACIÓN DE FORMULARIOS (Login, Registro y Contacto) */
    const formularios = document.querySelectorAll('form.form-interactivo');
    formularios.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const aviso = form.querySelector('.mensaje-exito');
            if (aviso) {
                aviso.style.display = 'block';
                form.reset();
            }
        });
    });
});