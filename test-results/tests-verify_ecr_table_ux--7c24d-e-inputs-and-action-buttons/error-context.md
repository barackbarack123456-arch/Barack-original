# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Logo" [ref=e5]
    - paragraph [ref=e6]: Inicie sesión para continuar.
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]: Correo electrónico
      - textbox "Correo electrónico" [ref=e10]: admin@barack.com
    - generic [ref=e11]:
      - generic [ref=e12]: Contraseña
      - textbox "Contraseña" [ref=e13]: barack
    - generic [ref=e14]:
      - link "¿Olvidaste tu contraseña?" [ref=e15] [cursor=pointer]:
        - /url: "#"
      - button "Iniciar Sesión" [ref=e16] [cursor=pointer]
  - paragraph [ref=e18]:
    - text: ¿No tienes cuenta?
    - link "Regístrate" [ref=e19] [cursor=pointer]:
      - /url: "#"
```