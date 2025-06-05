const { Command } = require("commander");
const program = new Command();

program
  .name("expense-tracker-cli")
  .description("cli환경에서 작동하는 간단한 지출 트래커 프로그램")
  .version("1.0.0");

// add 기능
program.command("add").description("");
