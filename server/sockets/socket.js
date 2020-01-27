const { io } = require('../server');

const { Usuarios } = require('../classes/usuarios');
const { crearMensaje } = require('../utilidades/utilidades')

const usuarios = new Usuarios();

io.on('connection', (client) => {
    console.log('Usuario conectado');

    client.on('entrarChat', (data, callback) => {
        // console.log(data);
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }
        client.join(data.sala);
        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSalas(data.sala));
        callback(usuarios.getPersonasPorSalas(data.sala));
    });
    client.on('crearMensaje', (data) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    });
    client.on('disconnect', () => {
        let usuarioBorrado = usuarios.borrarPersona(client.id);
        console.log(`Usuario ${usuarioBorrado.nombre} desconectado`);
        client.broadcast.to(usuarioBorrado.sala).emit('crearMensaje', crearMensaje('Administrador', `${usuarioBorrado.nombre} salio`));
        client.broadcast.to(usuarioBorrado.sala).emit('listaPersona', usuarios.getPersonasPorSalas(usuarioBorrado.sala));
    });
    // Mensajes privados
    client.on('mensajePrivado', data => {
        let persona = usuarios.getPersona(client.id);
        console.log(data.para);
        console.log(data.mensaje);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });
});