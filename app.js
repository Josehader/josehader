document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener referencias a los elementos del DOM
    const studentForm = document.getElementById('student-form');
    const studentIdInput = document.getElementById('student-id');
    const nombreInput = document.getElementById('nombre');
    const edadInput = document.getElementById('edad');
    const carreraInput = document.getElementById('carrera');
    const studentsList = document.getElementById('students-list');
    const clearFormBtn = document.getElementById('clear-form-btn');

    // Función auxiliar para mostrar mensajes al usuario
    function showMessage(message, type) {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        studentForm.before(messageDiv); // Inserta el mensaje antes del formulario

        setTimeout(() => {
            messageDiv.remove();
        }, 3000); // El mensaje desaparece después de 3 segundos
    }

    // 2. Función para obtener y mostrar todos los estudiantes
    async function fetchStudents() {
        try {
            const response = await fetch('/api/estudiantes'); // Realiza una solicitud GET a tu API
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const estudiantes = await response.json(); // Parsea la respuesta JSON

            studentsList.innerHTML = ''; // Limpia la lista antes de añadir los nuevos estudiantes
            estudiantes.forEach(estudiante => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div>
                        <span><strong>Nombre:</strong> ${estudiante.nombre}</span>
                        <span><strong>Edad:</strong> ${estudiante.edad}</span>
                        <span><strong>Carrera:</strong> ${estudiante.carrera}</span>
                    </div>
                    <div class="actions">
                        <button data-id="${estudiante.id}" class="edit-btn">Editar</button>
                        <button data-id="${estudiante.id}" class="delete-btn">Eliminar</button>
                    </div>
                `;
                studentsList.appendChild(li);
            });
        } catch (error) {
            console.error('Error al obtener estudiantes:', error);
            showMessage('Error al cargar la lista de estudiantes.', 'error');
        }
    }

    // 3. Manejar el envío del formulario (Agregar/Actualizar)
    studentForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previene el envío por defecto del formulario

        const id = studentIdInput.value;
        const nombre = nombreInput.value;
        const edad = parseInt(edadInput.value); // Convertir a número
        const carrera = carreraInput.value;

        if (!nombre || isNaN(edad) || !carrera) {
            showMessage('Por favor, completa todos los campos (nombre, edad, carrera).', 'error');
            return;
        }

        const studentData = { nombre, edad, carrera };

        try {
            let response;
            if (id) {
                // Si hay un ID, es una actualización (PUT)
                response = await fetch(`/api/estudiantes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studentData)
                });
            } else {
                // Si no hay ID, es una creación (POST)
                response = await fetch('/api/estudiantes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(studentData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            showMessage(`Estudiante ${id ? 'actualizado' : 'agregado'} con éxito.`, 'success');
            studentForm.reset(); // Limpia el formulario
            studentIdInput.value = ''; // Borra el ID oculto
            fetchStudents(); // Vuelve a cargar la lista de estudiantes
        } catch (error) {
            console.error('Error al guardar estudiante:', error);
            showMessage(`Error al guardar estudiante: ${error.message}`, 'error');
        }
    });

    // 4. Manejar clics en los botones de Editar y Eliminar
    studentsList.addEventListener('click', async (event) => {
        const target = event.target;

        // Botón de Editar
        if (target.classList.contains('edit-btn')) {
            const id = target.dataset.id; // Obtiene el ID del atributo data-id
            try {
                const response = await fetch(`/api/estudiantes/${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const estudiante = await response.json();
                
                // Rellenar el formulario con los datos del estudiante
                studentIdInput.value = estudiante.id;
                nombreInput.value = estudiante.nombre;
                edadInput.value = estudiante.edad;
                carreraInput.value = estudiante.carrera;

                showMessage('Formulario cargado para edición.', 'success');
            } catch (error) {
                console.error('Error al cargar estudiante para editar:', error);
                showMessage('Error al cargar datos del estudiante para edición.', 'error');
            }
        }

        // Botón de Eliminar
        if (target.classList.contains('delete-btn')) {
            const id = target.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este estudiante?')) { // Confirmación del usuario
                try {
                    const response = await fetch(`/api/estudiantes/${id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                         const errorData = await response.json();
                         throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                    }

                    showMessage('Estudiante eliminado con éxito.', 'success');
                    fetchStudents(); // Vuelve a cargar la lista
                    clearForm(); // Limpia el formulario si estaba editando el estudiante eliminado
                } catch (error) {
                    console.error('Error al eliminar estudiante:', error);
                    showMessage(`Error al eliminar estudiante: ${error.message}`, 'error');
                }
            }
        }
    });

    // 5. Limpiar formulario
    clearFormBtn.addEventListener('click', clearForm);

    function clearForm() {
        studentForm.reset();
        studentIdInput.value = '';
        showMessage('Formulario limpiado.', 'success');
    }

    // 6. Cargar los estudiantes al iniciar la página
    fetchStudents();
});