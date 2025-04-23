const Footer = () => {
    const currentYear = new Date().getFullYear()
  
    return (
      <footer className="bg-card border-t border-border py-3 px-4 md:px-6 text-center text-sm text-muted-foreground">
        <p>© {currentYear} Legger Colombia. Sistema de Gestión QA. Todos los derechos reservados.</p>
      </footer>
    )
  }
  
  export default Footer
  