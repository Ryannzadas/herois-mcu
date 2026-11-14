# Imagens dos personagens

Uma pasta por personagem, com o `id` definido em `src/data/characters.ts`:

```
public/characters/{id}/traje.png   ← PNG com fundo transparente, 1000×1400, corpo inteiro, centralizado
public/characters/{id}/thumb.png   ← miniatura para o seletor (ex.: 300×300)
```

Se a imagem vier fora do padrão, o código recorta pelo canal alfa e reenquadra
(escala + posição) para todas ficarem alinhadas. Enquanto não houver imagem,
o site gera um placeholder com silhueta e o nome do personagem.
