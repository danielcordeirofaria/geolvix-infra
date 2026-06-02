-- Migration 008: campo senha_temporaria na tabela usuarios
--
-- Indica que o usuário foi criado pelo admin com senha gerada automaticamente
-- e ainda não realizou a troca obrigatória no primeiro acesso.
-- Quando true, o login retorna trocarSenha=true e o frontend redireciona
-- para a tela de troca de senha antes de liberar o dashboard.

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN NOT NULL DEFAULT FALSE;

-- Usuários existentes mantêm FALSE (criados via registro normal, definiram a própria senha).
-- Apenas usuários criados pelo admin a partir desta versão receberão TRUE.

COMMENT ON COLUMN usuarios.senha_temporaria
    IS 'TRUE enquanto o usuário não trocar a senha temporária gerada pelo admin no primeiro acesso.';
