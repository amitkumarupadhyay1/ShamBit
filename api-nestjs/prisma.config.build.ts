import { defineConfig } from 'prisma/config'

export default defineConfig({
  datasource: {
    url: 'postgresql://dummy:dummy@localhost:5432/dummy',
  },
})