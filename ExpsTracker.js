const { Command } = require("commander");
const fs = require("fs");
const path = require("path");
const { json } = require("stream/consumers");
const program = new Command();

const expenseFile = path.join(__dirname, "Expense.json");

const id = 1;

function loadFile() {
  try {
    if (fs.existsSync(expenseFile)) {
      const data = fs.readFileSync(expenseFile);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("지출 데이터 불러오는 중 오류 발생: ", error.message);
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(expenseFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("지출 내역을 저장하는 중 오류 발생: ", error.message);
  }
}

program
  .name("expense-tracker-cli")
  .description("cli환경에서 작동하는 간단한 지출 트래커 프로그램")
  .version("1.0.0");

// add 기능
program
  .command("add")
  .description("지출 내역을 추가합니다.")
  .option("--description <text>", "지출 내역 설명", "")
  .option("--amount <money>", "지출 금액", "0")
  .action((text, money) => {
    const data = loadFile();
    const newData = { id: id++, description: text, amount: money };
    data.push(newData);
    saveData(data);
    console.log(
      `지출이 추가되었습니다. id: ${newData.id} | 설명: ${newData.description} | 금액: ${newData.amount}`
    );
  });
