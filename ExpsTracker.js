#!/usr/bin/env node

const { Command } = require("commander");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const program = new Command();

const expenseFile = path.join(__dirname, "Expense.csv");

function loadFile() {
  try {
    // 파일이 존재할 때
    if (fs.existsSync(expenseFile)) {
      const data = fs.readFileSync(expenseFile, "utf-8");
      if (data.trim() === "") {
        return [];
      }
      // papaparse를 이용해 parse
      const result = Papa.parse(data, {
        header: true, // 파일의 첫번째 줄을 헤더로 인식, 데이터를 객체로
        skipEmptyLines: true, // 비어있는 줄 건너뜀
        dynamicTyping: true, // 자동으로 데이터의 자료형을 정함
      });

      if (result.errors.length > 0) {
        console.error("CSV 파싱 중 오류 발생: ", error.message);
      }

      return result.data;
    }
    return [];
  } catch (error) {
    console.error("지출 데이터 불러오는 중 오류 발생: ", error.message);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(
      expenseFile,
      Papa.unparse(data, { header: true }),
      "utf-8"
    );
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
  .option("-d, --description <text>", "지출 내역 설명")
  .option("-a, --amount <money>", "지출 금액")
  .action((options) => {
    let data = loadFile();

    let nextId = 1;
    if (data.length > 0) {
      const maxId = Math.max(
        ...data.map((item) => (typeof item.id === "number" ? item.id : 0))
      );
      nextId = maxId + 1;
    }

    if (options.description === undefined || options.amount === undefined) {
      console.error("오류: 설명과 금액을 모두 입력하십시오. ");
      return;
    }
    const newData = {
      id: nextId,
      description: options.description,
      amount: parseInt(options.amount),
      date: new Date().toISOString(),
    };
    data.push(newData);
    saveData(data);
    console.log(
      `지출이 추가되었습니다. id: ${newData.id} | 날짜: ${new Date(
        newData.date
      ).toLocaleDateString()} | 설명: ${newData.description} | 금액: ${
        newData.amount
      }`
    );
  });

program
  .command("list")
  .description("지출 전체 목록 출력")
  .action(() => {
    let data = loadFile();
    if (!data || data.length === 0) {
      console.log("지출 내역이 없습니다.");
      return;
    }

    const idWidth = 5;
    const dateWidth = 12;
    const descriptionWidth = 30;
    const amountWidth = 12;

    console.log(
      "ID".padEnd(idWidth) +
        "Date".padEnd(dateWidth) +
        "Description".padEnd(descriptionWidth) +
        "Amount".padEnd(amountWidth)
    );

    console.log(
      "-".repeat(idWidth - 1) +
        " " +
        "-".repeat(dateWidth - 1) +
        " " +
        "-".repeat(descriptionWidth - 1) +
        " " +
        "-".repeat(amountWidth - 1)
    );

    data.forEach((item) => {
      const displayId = String(item.id).padEnd(idWidth);
      const displayDate = (
        item.date ? new Date(item.date).toISOString().split("T")[0] : "N/A"
      ).padEnd(dateWidth);
      let displayDescription = item.description;
      if (displayDescription.length > descriptionWidth - 1) {
        displayDescription =
          displayDescription.substring(0, descriptionWidth - 4) + "...";
      }
      displayDescription = displayDescription.padEnd(descriptionWidth);

      const displayAmount = String(item.amount);

      console.log(displayId + displayDate + displayDescription + displayAmount);
    });
  });

program
  .command("sum")
  .description("지출 총 합계(월별 지출 합계)")
  .option("-m, --month <monthNum>", "특정 월의 지출 합계 (1 - 12)")
  .action((options) => {
    let data = loadFile();
    if (!data || data.length === 0) {
      console.log("지출 내역이 없습니다.");
      console.log("지출 총 합계: 0");
      return;
    }

    let dataToSum = data;
    let isMonthSum = false;
    let targetMonth;

    if (options.month) {
      isMonthSum = true;
      targetMonth = parseInt(options.month, 10);

      if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
        console.error("오류: 월 입력을 확인하십시오.");
        return;
      }

      dataToSum = data.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate.getMonth() + 1 === targetMonth;
      });

      if (dataToSum.length === 0) {
        console.log(`${targetMonth}월의 지출 내역이 없습니다.`);
        console.log("합계: 0");
        return;
      }
    }

    let summary = 0;
    dataToSum.forEach((item) => {
      summary += Number(item.amount);
    });

    if (isMonthSum) {
      console.log(`${targetMonth}월 지출 총 합계: ${summary}`);
    } else {
      console.log(`지출 총 합계: ${summary}`);
    }
  });

program
  .command("del")
  .description("해당 지출 내역 삭제")
  .option("-i, --id <id>", "삭제할 지출")
  .action((options) => {
    if (!options.id) {
      console.log("해당하는 id를 찾지 못했습니다.");
      return;
    }
    let data = loadFile();
    data = data.filter((item) => item.id !== Number(options.id));
    console.log(`id: ${options.id} 지출 내역을 삭제하였습니다.`);
    saveData(data);
  });

program.parse(process.argv);
