FROM node:20.18.3

RUN npm install -g pnpm

RUN useradd -ms /bin/bash chartist
RUN mkdir /app && chown chartist:chartist /app
USER chartist
WORKDIR /app

COPY --chown=chartist:chartist . .

RUN pnpm install --frozen-lockfile
RUN pnpm run build
