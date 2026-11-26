FROM node:22-alpine

WORKDIR /app

# Dependências antes do código, pra aproveitar o cache das camadas nos rebuilds
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# Servidor de desenvolvimento do Vite. O --host 0.0.0.0 é pra ele aceitar conexões
# de fora do container (senão só o próprio container conseguiria abrir a página)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
