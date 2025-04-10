import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './CondoLoanSimulator.css';

const CondoLoanSimulator = () => {
  // スライダーのref
  const sliderRef = useRef(null);

  // 変数入力項目（最上部に移動）
  const [sellingPrice, setSellingPrice] = useState(50000000); // 売却価格（5000万円をデフォルト）
  const [sellingDate, setSellingDate] = useState(''); // 売却年月日

  // 1. 入力項目のステート
  // 物件価格関連
  const [totalPrice, setTotalPrice] = useState(0); // 物件総額
  const [landPrice, setLandPrice] = useState(0); // 土地価格
  const [buildingPrice, setBuildingPrice] = useState(0); // 建物価格
  const [buildingTax, setBuildingTax] = useState(0); // 建物消費税相当額
  const [useManualPriceBreakdown, setUseManualPriceBreakdown] = useState(false); // 内訳手動入力モード

  // 日付関連
  const [deliveryDate, setDeliveryDate] = useState(''); // 引渡日

  // 住宅ローン情報
  const [loanAmount, setLoanAmount] = useState(0); // 借入額
  const [loanTerm, setLoanTerm] = useState(35); // 借入期間（年）
  const [initialRate, setInitialRate] = useState(0.5); // 当初金利（%）
  const [monthlyPayment, setMonthlyPayment] = useState(0); // 月額返済額
  const [bonusPayment, setBonusPayment] = useState(0); // ボーナス返済額
  const [bonusMonths, setBonusMonths] = useState([1, 7]); // ボーナス返済時期
  const [interestRateHistory, setInterestRateHistory] = useState([]); // 金利変更履歴

  // 定期費用
  const [totalMonthlyFee, setTotalMonthlyFee] = useState(0); // 定期費用総額
  const [useDetailedMonthlyFees, setUseDetailedMonthlyFees] = useState(false); // 詳細入力モード
  const [managementFee, setManagementFee] = useState(0); // 管理費
  const [repairFund, setRepairFund] = useState(0); // 修繕積立金
  const [internetFee, setInternetFee] = useState(0); // インターネット設備使用料
  const [associationFee, setAssociationFee] = useState(0); // 町内会費
  const [bicycleParkingFee, setBicycleParkingFee] = useState(0); // 駐輪場使用料

  // 税金・保険関連
  const [acquisitionTax, setAcquisitionTax] = useState(0); // 不動産取得税
  const [propertyTaxPerPayment, setPropertyTaxPerPayment] = useState(0); // 固定資産税・都市計画税（1回あたり）
  const [fireInsurance, setFireInsurance] = useState(0); // 火災保険料

  // その他費用
  const [equipmentCost, setEquipmentCost] = useState(0); // 設備費

  // 売却関連費用
  const [cleaningCost, setCleaningCost] = useState(100000); // ハウスクリーニング費用
  const [movingCost, setMovingCost] = useState(200000); // 引越し費用

  // 追加のステート
  const [interestRateInput, setInterestRateInput] = useState({ date: '', rate: '' });
  const [showResults, setShowResults] = useState(false);
  const [remainingLoan, setRemainingLoan] = useState(0);
  const [hasRemainingLoan, setHasRemainingLoan] = useState(false);
  const [loanData, setLoanData] = useState([]);
  
  // 2. 計算ロジック
  
  // 物件価格の内訳自動計算
  useEffect(() => {
    if (!useManualPriceBreakdown && totalPrice > 0 && landPrice > 0) {
      const calculatedBuildingPrice = totalPrice - landPrice;
      if (calculatedBuildingPrice > 0) {
        // 建物価格と消費税相当額の計算
        const buildingPriceWithoutTax = Math.round(calculatedBuildingPrice / 1.1);
        const calculatedBuildingTax = calculatedBuildingPrice - buildingPriceWithoutTax;
        
        setBuildingPrice(buildingPriceWithoutTax);
        setBuildingTax(calculatedBuildingTax);
      }
    }
  }, [totalPrice, landPrice, useManualPriceBreakdown]);

  // 定期費用の合計計算
  useEffect(() => {
    if (useDetailedMonthlyFees) {
      const total = Number(managementFee) + Number(repairFund) + Number(internetFee) + 
                   Number(associationFee) + Number(bicycleParkingFee);
      setTotalMonthlyFee(total);
    }
  }, [managementFee, repairFund, internetFee, associationFee, bicycleParkingFee, useDetailedMonthlyFees]);
  
  // キーボード操作のイベントハンドラ
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement === sliderRef.current) {
        if (e.key === 'ArrowRight') {
          setSellingPrice(prev => Math.min(prev + 100000, 55000000)); // 10万円増加、最大5500万円
        } else if (e.key === 'ArrowLeft') {
          setSellingPrice(prev => Math.max(prev - 100000, 45000000)); // 10万円減少、最小4500万円
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // 建物取得価格の計算
  const buildingAcquisitionPrice = useMemo(() => {
    return Number(buildingPrice) + Number(buildingTax);
  }, [buildingPrice, buildingTax]);

  // 経過年数の計算
  const calculateElapsedYears = useMemo(() => {
    if (!deliveryDate || !sellingDate) return 0;
    
    const delivery = new Date(deliveryDate);
    const selling = new Date(sellingDate);
    
    if (isNaN(delivery.getTime()) || isNaN(selling.getTime())) return 0;
    
    let years = selling.getFullYear() - delivery.getFullYear();
    let months = selling.getMonth() - delivery.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    // 6ヶ月以上を1年に繰り上げ
    if (months >= 6) {
      years++;
    }
    
    return years;
  }, [deliveryDate, sellingDate]);

  // 減価償却費の計算
  const depreciationCost = useMemo(() => {
    return buildingAcquisitionPrice * 0.015 * calculateElapsedYears;
  }, [buildingAcquisitionPrice, calculateElapsedYears]);

  // 固定資産税総支払額の計算
  const totalPropertyTax = useMemo(() => {
    if (!deliveryDate || !sellingDate) return 0;
    
    const delivery = new Date(deliveryDate);
    const selling = new Date(sellingDate);
    
    if (isNaN(delivery.getTime()) || isNaN(selling.getTime())) return 0;
    
    // 固定資産税支払日（1月6日、2月28日、5月15日、7月31日と仮定）
    const paymentDates = [
      { month: 0, day: 6 },  // 1月6日
      { month: 1, day: 28 }, // 2月28日
      { month: 4, day: 15 }, // 5月15日
      { month: 6, day: 31 }  // 7月31日
    ];
    
    let paymentCount = 0;
    let currentDate = new Date(delivery);
    
    while (currentDate <= selling) {
      for (const date of paymentDates) {
        const paymentDate = new Date(currentDate.getFullYear(), date.month, date.day);
        if (paymentDate >= delivery && paymentDate <= selling) {
          paymentCount++;
        }
      }
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    
    return propertyTaxPerPayment * paymentCount;
  }, [deliveryDate, sellingDate, propertyTaxPerPayment]);

  // 取得費の計算
  const acquisitionCost = useMemo(() => {
    const propertyPrice = Number(landPrice) + Number(buildingPrice) + Number(buildingTax);
    return propertyPrice + Number(acquisitionTax) + totalPropertyTax + Number(equipmentCost) + Number(fireInsurance) - depreciationCost;
  }, [landPrice, buildingPrice, buildingTax, acquisitionTax, totalPropertyTax, equipmentCost, fireInsurance, depreciationCost]);

  // 仲介手数料の計算
  const brokerageFee = useMemo(() => {
    return (sellingPrice * 0.03 + 60000) * 1.1;
  }, [sellingPrice]);

  // 印紙税の計算
  const stampTax = useMemo(() => {
    if (sellingPrice <= 1000000) return 0;
    if (sellingPrice <= 5000000) return 2000;
    if (sellingPrice <= 10000000) return 10000;
    if (sellingPrice <= 50000000) return 20000;
    if (sellingPrice <= 100000000) return 60000;
    return 60000; // デフォルト値
  }, [sellingPrice]);

  // 譲渡費用合計の計算
  const totalTransferCost = useMemo(() => {
    const registrationTax = 2000; // 登録免許税
    const judicialScrivenerFee = 30000; // 司法書士報酬
    const certificateFee = 1100; // 各種証明書類
    const loanRepaymentFee = hasRemainingLoan ? 33000 : 0; // ローン一括返済費用
    
    return brokerageFee + stampTax + registrationTax + judicialScrivenerFee + 
           certificateFee + loanRepaymentFee + Number(cleaningCost) + Number(movingCost);
  }, [brokerageFee, stampTax, cleaningCost, movingCost, hasRemainingLoan]);

  // 譲渡所得の計算
  const transferIncome = useMemo(() => {
    return sellingPrice - (acquisitionCost + totalTransferCost);
  }, [sellingPrice, acquisitionCost, totalTransferCost]);

  // 所有期間の判定
  const isOver5Years = useMemo(() => {
    return calculateElapsedYears > 5;
  }, [calculateElapsedYears]);

  // 譲渡所得税の計算
  const transferIncomeTax = useMemo(() => {
    if (transferIncome <= 0) return 0;
    return transferIncome * (isOver5Years ? 0.20315 : 0.3963);
  }, [transferIncome, isOver5Years]);

  // 売却で得た金額の計算
  const totalSaleAmount = useMemo(() => {
    return sellingPrice - totalTransferCost;
  }, [sellingPrice, totalTransferCost]);

  // 住宅ローン計算用のデータ生成
  useEffect(() => {
    if (!deliveryDate || loanAmount <= 0 || loanTerm <= 0 || initialRate <= 0) {
      setLoanData([]);
      setRemainingLoan(0);
      setHasRemainingLoan(false);
      return;
    }
    
    const calculateLoanData = () => {
      const startDate = new Date(deliveryDate);
      const totalMonths = loanTerm * 12;
      const data = [];
      
      let currentPrincipal = loanAmount;
      let currentRate = initialRate / 100 / 12; // 月利に変換
      let totalPaid = 0;
      
      // 金利変更履歴を日付でソート
      const sortedRateHistory = [...interestRateHistory].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
      
      let rateHistoryIndex = 0;
      
      for (let i = 0; i < totalMonths; i++) {
        const currentDate = new Date(startDate);
        currentDate.setMonth(startDate.getMonth() + i);
        
        // 金利変更履歴をチェック
        while (rateHistoryIndex < sortedRateHistory.length) {
          const changeDate = new Date(sortedRateHistory[rateHistoryIndex].date);
          if (changeDate <= currentDate) {
            currentRate = sortedRateHistory[rateHistoryIndex].rate / 100 / 12; // 月利に変換
            rateHistoryIndex++;
          } else {
            break;
          }
        }
        
        // 月々の返済額から利息を引いて元金返済額を計算
        const interestPayment = currentPrincipal * currentRate;
        let principalPayment = monthlyPayment - interestPayment;
        
        // ボーナス返済があれば追加
        let bonusPaymentAmount = 0;
        if (bonusMonths.includes(currentDate.getMonth() + 1)) {
          bonusPaymentAmount = bonusPayment;
          principalPayment += bonusPaymentAmount;
        }
        
        // 残債が返済額より少ない場合は調整
        if (currentPrincipal < principalPayment) {
          principalPayment = currentPrincipal;
        }
        
        // 元金を減らす
        currentPrincipal -= principalPayment;
        
        // 累計返済額を増やす
        totalPaid += (monthlyPayment + bonusPaymentAmount);
        
        // データポイント作成
        data.push({
          date: currentDate.toISOString().slice(0, 7), // YYYY-MM形式
          remainingPrincipal: currentPrincipal,
          totalPaid: totalPaid,
          interestRate: currentRate * 12 * 100, // 年率(%)に戻す
          monthlyPayment: monthlyPayment,
          bonusPayment: bonusPaymentAmount
        });
        
        // 完済したら終了
        if (currentPrincipal <= 0) {
          break;
        }
      }
      
      setLoanData(data);
      
      // 売却日に対応するローン残債を特定
      if (sellingDate) {
        const sellingDateObj = new Date(sellingDate);
        const sellingYearMonth = sellingDateObj.toISOString().slice(0, 7);
        
        const closestDataPoint = data.reduce((closest, current) => {
          if (current.date <= sellingYearMonth) {
            return current;
          }
          return closest;
        }, data[0]);
        
        if (closestDataPoint) {
          setRemainingLoan(closestDataPoint.remainingPrincipal);
          setHasRemainingLoan(closestDataPoint.remainingPrincipal > 0);
        }
      }
    };
    
    calculateLoanData();
  }, [
    deliveryDate, 
    sellingDate,
    loanAmount, 
    loanTerm, 
    initialRate, 
    monthlyPayment, 
    bonusPayment, 
    bonusMonths, 
    interestRateHistory
  ]);

  // 最終的な投資収支の計算
  const finalInvestmentBalance = useMemo(() => {
    return totalSaleAmount - remainingLoan;
  }, [totalSaleAmount, remainingLoan]);

  // 金利変更履歴の追加
  const addInterestRateHistory = () => {
    if (interestRateInput.date && interestRateInput.rate) {
      setInterestRateHistory([
        ...interestRateHistory,
        {
          date: interestRateInput.date,
          rate: parseFloat(interestRateInput.rate)
        }
      ]);
      setInterestRateInput({ date: '', rate: '' });
    }
  };

  // 金利変更履歴の削除
  const removeInterestRateHistory = (index) => {
    setInterestRateHistory(interestRateHistory.filter((_, i) => i !== index));
  };

  // 計算実行
  const calculateResults = () => {
    setShowResults(true);
  };

  // 日本円表示用のフォーマッター
  const formatJPY = (value) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(value);
  };

  // 金利表示用のフォーマッター
  const formatPercent = (value) => {
    return `${value.toFixed(3)}%`;
  };

  // チャートのカスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="desc">{`金利: ${formatPercent(payload[0].payload.interestRate)}`}</p>
          <p className="desc">{`ローン残債: ${formatJPY(payload[0].payload.remainingPrincipal)}`}</p>
          <p className="desc">{`返済累計額: ${formatJPY(payload[0].payload.totalPaid)}`}</p>
          <p className="desc">{`月額返済額: ${formatJPY(payload[0].payload.monthlyPayment)}`}</p>
          {payload[0].payload.bonusPayment > 0 && (
            <p className="desc">{`ボーナス返済額: ${formatJPY(payload[0].payload.bonusPayment)}`}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // 数値入力のハンドラ - 空文字をNULLに変換
  const handleNumberInput = (setValue) => (e) => {
    if (e.target.value === '') {
      setValue('');
    } else {
      setValue(Number(e.target.value));
    }
  };

  return (
    <div className="condo-loan-simulator">
      <h1>分譲マンション売却・ローン残債シミュレーター</h1>
      
      <div className="simulator-container">
        <div className="input-section">
          <h2>入力項目</h2>
          
          {/* 売却情報（最上部に移動） */}
          <section className="input-group selling-info">
            <h3>売却情報</h3>
            <div className="form-row selling-price">
              <label>
                売却価格:
                <div className="price-slider-container">
                  <input 
                    type="range" 
                    min="45000000" 
                    max="55000000" 
                    step="100000" 
                    value={sellingPrice} 
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="price-slider"
                    ref={sliderRef}
                    tabIndex="0"
                  />
                  <div className="price-display">
                    <input 
                      type="number" 
                      value={sellingPrice} 
                      onChange={handleNumberInput(setSellingPrice)} 
                      min="0"
                      className="price-input"
                    />
                    <span>円</span>
                  </div>
                  <div className="slider-labels">
                    <span>4,500万円</span>
                    <span>5,000万円</span>
                    <span>5,500万円</span>
                  </div>
                </div>
              </label>
              <div className="slider-help">
                スライダーを動かすか、直接金額を入力してください。キーボードの←→キーでも調整できます。
              </div>
            </div>
            <div className="form-row">
              <label>
                売却年月日:
                <input 
                  type="date" 
                  value={sellingDate} 
                  onChange={(e) => setSellingDate(e.target.value)} 
                  min="2023-01-01"
                />
              </label>
            </div>
          </section>
          
          <section className="input-group">
            <h3>物件価格関連</h3>
            <div className="toggle-container">
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  checked={useManualPriceBreakdown} 
                  onChange={(e) => setUseManualPriceBreakdown(e.target.checked)} 
                />
                内訳を個別に入力する
              </label>
            </div>
            
            {!useManualPriceBreakdown ? (
              <>
                <div className="form-row">
                  <label>
                    物件総額:
                    <input 
                      type="number" 
                      value={totalPrice} 
                      onChange={handleNumberInput(setTotalPrice)} 
                      min="0"
                      placeholder="例: 50000000"
                    />
                    円
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    土地価格:
                    <input 
                      type="number" 
                      value={landPrice} 
                      onChange={handleNumberInput(setLandPrice)} 
                      min="0"
                      placeholder="例: 30000000"
                    />
                    円
                  </label>
                </div>
                <div className="form-row calculation-result">
                  <span>建物価格: {formatJPY(buildingPrice)}</span>
                </div>
                <div className="form-row calculation-result">
                  <span>建物消費税相当額: {formatJPY(buildingTax)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="form-row">
                  <label>
                    土地価格:
                    <input 
                      type="number" 
                      value={landPrice} 
                      onChange={handleNumberInput(setLandPrice)} 
                      min="0"
                      placeholder="例: 30000000"
                    />
                    円
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    建物価格:
                    <input 
                      type="number" 
                      value={buildingPrice} 
                      onChange={handleNumberInput(setBuildingPrice)} 
                      min="0"
                      placeholder="例: 18000000"
                    />
                    円
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    建物消費税相当額:
                    <input 
                      type="number" 
                      value={buildingTax} 
                      onChange={handleNumberInput(setBuildingTax)} 
                      min="0"
                      placeholder="例: 2000000"
                    />
                    円
                  </label>
                </div>
                <div className="form-row calculation-result">
                  <span>物件総額: {formatJPY(Number(landPrice) + Number(buildingPrice) + Number(buildingTax))}</span>
                </div>
              </>
            )}
          </section>
          
          <section className="input-group">
            <h3>日付関連</h3>
            <div className="form-row">
              <label>
                引渡日:
                <input 
                  type="date" 
                  value={deliveryDate} 
                  onChange={(e) => setDeliveryDate(e.target.value)} 
                  min="2023-01-01"
                />
              </label>
            </div>
          </section>
          
          <section className="input-group">
            <h3>住宅ローン情報</h3>
            <div className="form-row">
              <label>
                借入額:
                <input 
                  type="number" 
                  value={loanAmount} 
                  onChange={handleNumberInput(setLoanAmount)} 
                  min="0"
                  placeholder="例: 40000000"
                />
                円
              </label>
            </div>
            <div className="form-row">
              <label>
                借入期間:
                <input 
                  type="number" 
                  value={loanTerm} 
                  onChange={handleNumberInput(setLoanTerm)} 
                  min="1"
                  max="50"
                  placeholder="例: 35"
                />
                年
              </label>
            </div>
            <div className="form-row">
              <label>
                当初金利:
                <input 
                  type="number" 
                  value={initialRate} 
                  onChange={handleNumberInput(setInitialRate)} 
                  min="0"
                  step="0.001"
                  placeholder="例: 0.5"
                />
                %
              </label>
            </div>
            <div className="form-row">
              <label>
                月額返済額:
                <input 
                  type="number" 
                  value={monthlyPayment} 
                  onChange={handleNumberInput(setMonthlyPayment)} 
                  min="0"
                  placeholder="例: 100000"
                />
                円
              </label>
            </div>
            <div className="form-row">
              <label>
                ボーナス返済額:
                <input 
                  type="number" 
                  value={bonusPayment} 
                  onChange={handleNumberInput(setBonusPayment)} 
                  min="0"
                  placeholder="例: 300000"
                />
                円
              </label>
            </div>
            <div className="form-row">
              <label>
                金利変更履歴:
                <div className="interest-rate-history">
                  <div className="interest-rate-input">
                    <input 
                      type="date" 
                      value={interestRateInput.date} 
                      onChange={(e) => setInterestRateInput({...interestRateInput, date: e.target.value})} 
                      placeholder="変更日"
                      min="2023-01-01"
                    />
                    <input 
                      type="number" 
                      value={interestRateInput.rate} 
                      onChange={(e) => setInterestRateInput({...interestRateInput, rate: e.target.value})} 
                      min="0"
                      step="0.001"
                      placeholder="金利(%)"
                    />
                    <button type="button" onClick={addInterestRateHistory}>追加</button>
                  </div>
                  <ul className="interest-rate-list">
                    {interestRateHistory.map((item, index) => (
                      <li key={index}>
                        {item.date}: {item.rate}%
                        <button type="button" onClick={() => removeInterestRateHistory(index)}>削除</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </label>
            </div>
          </section>
          
          <section className="input-group">
            <h3>定期費用</h3>
            <div className="toggle-container">
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  checked={useDetailedMonthlyFees} 
                  onChange={(e) => setUseDetailedMonthlyFees(e.target.checked)} 
                />
                費用を個別に入力する
              </label>
            </div>
            
            {!useDetailedMonthlyFees ? (
              <div className="form-row">
                <label>
                  定期費用総額:
                  <input 
                    type="number" 
                    value={totalMonthlyFee} 
                    onChange={handleNumberInput(setTotalMonthlyFee)} 
                    min="0"
                    placeholder="例: 30000"
                  />
                  円/月
                </label>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <label>
                    管理費:
                    <input 
                      type="number" 
                      value={managementFee} 
                      onChange={handleNumberInput(setManagementFee)} 
                      min="0"
                      placeholder="例: 15000"
                    />
                    円/月
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    修繕積立金:
                    <input 
                      type="number" 
                      value={repairFund} 
                      onChange={handleNumberInput(setRepairFund)} 
                      min="0"
                      placeholder="例: 10000"
                    />
                    円/月
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    インターネット設備使用料:
                    <input 
                      type="number" 
                      value={internetFee} 
                      onChange={handleNumberInput(setInternetFee)} 
                      min="0"
                      placeholder="例: 3000"
                    />
                    円/月
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    町内会費:
                    <input 
                      type="number" 
                      value={associationFee} 
                      onChange={handleNumberInput(setAssociationFee)} 
                      min="0"
                      placeholder="例: 500"
                    />
                    円/月
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    駐輪場使用料:
                    <input 
                      type="number" 
                      value={bicycleParkingFee} 
                      onChange={handleNumberInput(setBicycleParkingFee)} 
                      min="0"
                      placeholder="例: 1500"
                    />
                    円/月
                  </label>
                </div>
              </>
            )}
          </section>
          
          <section className="input-group">
            <h3>税金・保険関連</h3>
            <div className="form-row">
              <label>
                不動産取得税:
                <input 
                  type="number" 
                  value={acquisitionTax} 
                  onChange={handleNumberInput(setAcquisitionTax)} 
                  min="0"
                  placeholder="例: 500000"
                />
                円
              </label>
            </div>
            <div className="form-row">
              <label>
                固定資産税・都市計画税(1回あたり):
                <input 
                  type="number" 
                  value={propertyTaxPerPayment} 
                  onChange={handleNumberInput(setPropertyTaxPerPayment)} 
                  min="0"
                  placeholder="例: 75000"
                />
                円
              </label>
            </div>
            <div className="form-row">
              <label>
                火災保険料:
                <input 
                  type="number" 
                  value={fireInsurance} 
                  onChange={handleNumberInput(setFireInsurance)} 
                  min="0"
                  placeholder="例: 100000"
                />
                円
              </label>
            </div>
          </section>
          
          <section className="input-group">
            <h3>その他費用</h3>
            <div className="form-row">
              <label>
                設備費:
                <input 
                  type="number" 
                  value={equipmentCost} 
                  onChange={handleNumberInput(setEquipmentCost)} 
                  min="0"
                  placeholder="例: 300000"
                />
                円
              </label>
            </div>
          </section>
          
          <section className="input-group">
            <h3>売却関連費用</h3>
            <div className="form-row">
              <label>
                ハウスクリーニング費用:
                <input 
                  type="number" 
                  value={cleaningCost} 
                  onChange={handleNumberInput(setCleaningCost)} 
                  min="0"
                  placeholder="例: 100000"
                />
                円 (目安: 100,000円)
              </label>
            </div>
            <div className="form-row">
              <label>
                引越し費用:
                <input 
                  type="number" 
                  value={movingCost} 
                  onChange={handleNumberInput(setMovingCost)} 
                  min="0"
                  placeholder="例: 200000"
                />
                円 (目安: 200,000円)
              </label>
            </div>
          </section>
          
          <button className="calculate-button" onClick={calculateResults}>計算する</button>
        </div>
        
      </div>

      {showResults && (
        <div className="results-container">
          <h2>計算結果</h2>
          
          <div className="results-summary">
            <section className="result-highlight">
              <h3>最終的な投資収支</h3>
              <div className={`highlight-value ${finalInvestmentBalance >= 0 ? 'positive' : 'negative'}`}>
                {formatJPY(finalInvestmentBalance)}
              </div>
              <div className="highlight-details">
                <div className="highlight-row">
                  <span>売却で得た金額:</span>
                  <span>{formatJPY(totalSaleAmount)}</span>
                </div>
                <div className="highlight-row">
                  <span>住宅ローン残債:</span>
                  <span>{formatJPY(remainingLoan)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="results-grid">
            <section className="result-group">
              <h3>基本情報</h3>
              <div className="result-row">
                <span className="result-label">建物取得価格:</span>
                <span className="result-value">{formatJPY(buildingAcquisitionPrice)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">経過年数:</span>
                <span className="result-value">{calculateElapsedYears}年</span>
              </div>
              <div className="result-row">
                <span className="result-label">減価償却費:</span>
                <span className="result-value">{formatJPY(depreciationCost)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">固定資産税総支払額:</span>
                <span className="result-value">{formatJPY(totalPropertyTax)}</span>
              </div>
            </section>
            
            <section className="result-group">
              <h3>取得費・譲渡費用</h3>
              <div className="result-row">
                <span className="result-label">取得費:</span>
                <span className="result-value">{formatJPY(acquisitionCost)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">仲介手数料:</span>
                <span className="result-value">{formatJPY(brokerageFee)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">印紙税:</span>
                <span className="result-value">{formatJPY(stampTax)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">譲渡費用合計:</span>
                <span className="result-value">{formatJPY(totalTransferCost)}</span>
              </div>
            </section>
            
            <section className="result-group">
              <h3>譲渡所得・税金</h3>
              <div className="result-row">
                <span className="result-label">譲渡所得:</span>
                <span className="result-value">{formatJPY(transferIncome)}</span>
              </div>
              <div className="result-row">
                <span className="result-label">所有期間:</span>
                <span className="result-value">{isOver5Years ? '5年超' : '5年以下'}</span>
              </div>
              <div className="result-row">
                <span className="result-label">譲渡所得税(税率 {isOver5Years ? '20.315%' : '39.63%'}):</span>
                <span className="result-value">{formatJPY(transferIncomeTax)}</span>
              </div>
            </section>
          </div>
          
          <section className="chart-section">
            <h3>住宅ローン推移グラフ</h3>
            {loanData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={loanData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="remainingPrincipal" 
                    name="ローン残債" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="totalPaid" 
                    name="返済累計額" 
                    stroke="#82ca9d" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="interestRate" 
                    name="金利(%)" 
                    stroke="#ff7300" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data-message">ローンデータがありません。必要な情報を入力してください。</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default CondoLoanSimulator;