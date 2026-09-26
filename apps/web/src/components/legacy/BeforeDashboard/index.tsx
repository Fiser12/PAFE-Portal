import React from 'react'
import Link from 'next/link'
import './index.scss'

export default function BeforeDashboard() {
  return (
    <div className="before-dashboard">
      <h2>Gestión de PAFE</h2>
      <p>Administración está reservada a Alberto y Rubén. El equipo técnico son los psicólogos.</p>
      <h3>Invitar a una persona</h3>
      <ol>
        <li>
          Abre <Link href="/admin/collections/users">Usuarios</Link> y pulsa <strong>Invite User</strong>.
        </li>
        <li>
          Selecciona <strong>Familia</strong> para las familias o <strong>Profesional</strong> para
          los psicólogos. El formulario de invitación muestra estos nombres; la ficha del usuario
          muestra los nombres completos.
        </li>
        <li>
          Introduce su correo en <strong>Email Address</strong> y pulsa <strong>Send Email</strong>.
          La persona recibe un enlace para crear su cuenta y contraseña, y entrar al Foro.
        </li>
        <li>
          Para la siguiente persona, vuelve al listado de Usuarios y abre una nueva invitación. Cada
          enlace sirve para una sola alta.
        </li>
      </ol>
      <p>
        Si ya tiene cuenta, búscala por su correo y edita su rol. No hace falta crear otra. Entrar
        con Google sin invitación deja la cuenta pendiente, sin rol: asígnalo desde Usuarios.
      </p>
      <h3>Permisos y grupos</h3>
      <ul>
        <li>
          <strong>Familia:</strong> Calendario, Foro, Moodle y Área personal. Sin Catálogo, Wiki ni
          Administración.
        </li>
        <li>
          <strong>Psicólogo/a (equipo técnico):</strong> lo anterior más Catálogo, Wiki y el área
          LANTALDE TEKNIKOA del foro. Sin acceso al panel de Administración.
        </li>
        <li>
          <strong>Administración:</strong> gestión completa. Reservar este rol a Alberto y Rubén.
        </li>
      </ul>
      <p>
        Los psicólogos con rol profesional ya tienen acceso al equipo técnico. El grupo{' '}
        <strong>lantalde-teknikoa</strong> conserva la pertenencia al equipo del foro anterior: se
        puede crear en <Link href="/admin/collections/groups">Grupos de usuarios</Link> y asignar desde la
        ficha de cada persona. No añadir familias a ese grupo. Un grupo por sí solo no activa una
        cuenta sin rol.
      </p>
      <p>
        La migración conservó publicaciones y autores históricos, pero no creó las cuentas ni
        importó las contraseñas. Revisa cada alta con el listado del foro anterior; los nombres de
        los autores no conceden permisos.
      </p>
      <h3>Crear una noticia</h3>
      <p>
        Entra en <Link href="/admin/collections/noticia/create">Crear noticia</Link>, elige el área,
        escribe el título y contenido, revisa la fecha de publicación y guarda. Berriak PAFE envía
        un aviso a las familias al publicarse. Las otras áreas no envían ese aviso. También puedes
        empezar desde el botón Crear noticia del Foro.
      </p>
    </div>
  )
}
