from fastapi import Header, HTTPException

def verificar_token(authorization: str = Header(default=None)):
    """
    Dependencia que exige el envío de un token en los Headers.
    Formato esperado: 'Authorization: Bearer <token>'
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Acceso denegado. Token de autorización faltante o con formato incorrecto."
        )
    
    # Extraemos el token quitando la palabra "Bearer "
    token = authorization.split(" ")[1]
    
    # A futuro, aquí desencriptaremos el JWT real. Por ahora, si hay token, pasa.
    return token