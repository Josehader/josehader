// 1. Importa el módulo 'http' de Node.js
const http = require('http');
// 2. Importa el módulo 'url' para parsear URLs fácilmente
const url = require('url');

// 3. Define el puerto en el que el servidor escuchará
const PORT = 3000;

// --- Simulación de Base de Datos (en memoria) ---
let estudiantes = [
    { id: 1, nombre: 'Ana García', edad: 20, carrera: 'Ingeniería de Software' },
    { id: 2, nombre: 'Juan Pérez', edad: 22, carrera: 'Diseño Gráfico' },
    { id: 3, nombre: 'María López', edad: 21, carrera: 'Marketing Digital' }
];

let nextId = 4;

// --- Función para parsear el cuerpo de la solicitud (JSON) ---
// Node.js nativo no parsea JSON automáticamente como Express
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Convierte los datos del buffer a string
        });
        req.on('end', () => {
            if (body) {
                try {
                    resolve(JSON.parse(body)); // Intenta parsear el string JSON
                } catch (error) {
                    reject(new Error('JSON inválido en el cuerpo de la solicitud.'));
                }
            } else {
                resolve({}); // Si no hay cuerpo, resuelve con un objeto vacío
            }
        });
        req.on('error', err => reject(err));
    });
}

// --- Crea el Servidor HTTP ---
const server = http.createServer(async (req, res) => {
    // 4. Parsear la URL de la solicitud
    const parsedUrl = url.parse(req.url, true); // 'true' para parsear también los query parameters
    const pathname = parsedUrl.pathname; // La ruta de la URL sin el dominio ni los parámetros
    const method = req.method; // El método HTTP (GET, POST, PUT, DELETE)

    // Configura los encabezados de respuesta comunes
    res.setHeader('Content-Type', 'application/json'); // Siempre responderemos con JSON

    // --- Lógica de Enrutamiento (Routing) ---

    // Ruta de prueba
    if (pathname === '/' && method === 'GET') {
        res.statusCode = 200;
        res.end(JSON.stringify({ message: '¡Bienvenido a la API de Estudiantes (Nativa Node.js)!' }));
        return; // Importante para detener la ejecución
    }

    // GET /api/estudiantes - Obtener todos los estudiantes
    if (pathname === '/api/estudiantes' && method === 'GET') {
        res.statusCode = 200; // OK
        res.end(JSON.stringify(estudiantes));
        return;
    }

    // GET /api/estudiantes/:id - Obtener un estudiante por ID
    // Usamos una expresión regular simple para capturar el ID
    const matchId = pathname.match(/^\/api\/estudiantes\/(\d+)$/);
    if (matchId && method === 'GET') {
        const id = parseInt(matchId[1]); // matchId[1] contiene el ID capturado
        const estudiante = estudiantes.find(est => est.id === id);

        if (estudiante) {
            res.statusCode = 200; // OK
            res.end(JSON.stringify(estudiante));
        } else {
            res.statusCode = 404; // Not Found
            res.end(JSON.stringify({ message: 'Estudiante no encontrado.' }));
        }
        return;
    }

    // POST /api/estudiantes - Crear un nuevo estudiante
    if (pathname === '/api/estudiantes' && method === 'POST') {
        try {
            const body = await getRequestBody(req); // Esperamos a que se lea el cuerpo
            const nuevoEstudiante = {
                id: nextId++,
                nombre: body.nombre,
                edad: body.edad,
                carrera: body.carrera
            };

            if (!nuevoEstudiante.nombre || !nuevoEstudiante.edad || !nuevoEstudiante.carrera) {
                res.statusCode = 400; // Bad Request
                res.end(JSON.stringify({ message: 'Nombre, edad y carrera son campos obligatorios.' }));
                return;
            }

            estudiantes.push(nuevoEstudiante);
            res.statusCode = 201; // Created
            res.end(JSON.stringify(nuevoEstudiante));
        } catch (error) {
            res.statusCode = 400; // Bad Request (para JSON inválido)
            res.end(JSON.stringify({ message: error.message }));
        }
        return;
    }

    // PUT /api/estudiantes/:id - Actualizar un estudiante
    if (matchId && method === 'PUT') {
        const id = parseInt(matchId[1]);
        const estudianteIndex = estudiantes.findIndex(est => est.id === id);

        if (estudianteIndex !== -1) {
            try {
                const body = await getRequestBody(req);
                const estudianteActualizado = {
                    id: id,
                    nombre: body.nombre,
                    edad: body.edad,
                    carrera: body.carrera
                };

                if (!estudianteActualizado.nombre || !estudianteActualizado.edad || !estudianteActualizado.carrera) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Nombre, edad y carrera son campos obligatorios.' }));
                    return;
                }

                estudiantes[estudianteIndex] = estudianteActualizado;
                res.statusCode = 200; // OK
                res.end(JSON.stringify(estudianteActualizado));
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ message: error.message }));
            }
        } else {
            res.statusCode = 404; // Not Found
            res.end(JSON.stringify({ message: 'Estudiante no encontrado.' }));
        }
        return;
    }

    // DELETE /api/estudiantes/:id - Eliminar un estudiante
    if (matchId && method === 'DELETE') {
        const id = parseInt(matchId[1]);
        const estudianteIndex = estudiantes.findIndex(est => est.id === id);

        if (estudianteIndex !== -1) {
            estudiantes.splice(estudianteIndex, 1);
            res.statusCode = 204; // No Content
            res.end(); // No hay cuerpo en la respuesta 204
        } else {
            res.statusCode = 404; // Not Found
            res.end(JSON.stringify({ message: 'Estudiante no encontrado.' }));
        }
        return;
    }

    // Manejar rutas no encontradas (404)
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Ruta no encontrada.' }));
});

// --- Inicia el Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor de estudiantes nativo escuchando en http://localhost:${PORT}`);
});