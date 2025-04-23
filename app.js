// 物理实验数据处理助手主程序
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let experimentData = [];
    let currentExperimentType = 'mechanics';
    let resultChart = null;

    // DOM元素
    const experimentTypeSelect = document.getElementById('experiment-type');
    const dataTextArea = document.getElementById('data-text');
    const dataFileInput = document.getElementById('data-file');
    const uploadBtn = document.getElementById('upload-btn');
    const processBtn = document.getElementById('process-btn');
    const processingOptionsDiv = document.querySelector('.processing-options');
    const dataTableDiv = document.querySelector('.data-table');
    const chartCanvas = document.getElementById('result-chart');

    // 初始化
    initEventListeners();
    updateProcessingOptions();
    updateDataInputHint();

    // 事件监听器初始化
    function initEventListeners() {
        experimentTypeSelect.addEventListener('change', function() {
            currentExperimentType = this.value;
            updateProcessingOptions();
            updateDataInputHint();
            clearResults();
        });

        uploadBtn.addEventListener('click', handleFileUpload);
        processBtn.addEventListener('click', processData);
    }

    // 更新数据输入提示
    function updateDataInputHint() {
        const hints = {
            mechanics: "请输入力学实验数据，每行一组数据，用空格或逗号分隔\n例如：\n0.1 0.98\n0.2 1.96\n0.3 2.94\n(第一列为位移/时间，第二列为力/速度)",
            electricity: "请输入电学实验数据，每行一组数据，用空格或逗号分隔\n例如：\n1.0 0.1\n2.0 0.2\n3.0 0.3\n(第一列为电压(V)，第二列为电流(A))",
            optics: "请输入光学实验数据，每行一组数据，用空格或逗号分隔\n例如：\n30 20\n45 28\n60 35\n(第一列为入射角(度)，第二列为折射角(度))",
            thermodynamics: "请输入热学实验数据，每行一组数据，用空格或逗号分隔\n例如：\n100 0.5 10\n200 0.5 20\n300 0.5 30\n(第一列为热量(J)，第二列为质量(kg)，第三列为温度变化(K))",
            oscilloscope: "请输入示波器数据，每行一组数据，用空格或逗号分隔\n例如：\n50 100 0.25\n60 120 0.5\n(第一列为fy，第二列为fx，第三列为相位差φ，φ取值为0-1.75,0.25为间隔)"
        };
        dataTextArea.placeholder = hints[currentExperimentType] || "请在此输入实验数据...";
    }

    // 更新处理选项
    function updateProcessingOptions() {
        processingOptionsDiv.innerHTML = '';
        
        const options = getProcessingOptions(currentExperimentType);
        options.forEach(option => {
            const div = document.createElement('div');
            div.className = 'processing-option';
            
            const input = document.createElement('input');
            input.type = option.type;
            input.id = option.id;
            input.name = option.name;
            input.value = option.value;
            if (option.checked) input.checked = true;
            
            const label = document.createElement('label');
            label.htmlFor = option.id;
            label.textContent = option.label;
            
            div.appendChild(input);
            div.appendChild(label);
            processingOptionsDiv.appendChild(div);
        });
    }

    // 获取处理选项
    function getProcessingOptions(experimentType) {
        const commonOptions = [
            {
                type: 'checkbox',
                id: 'error-calculation',
                name: 'error-calculation',
                value: 'error',
                label: '计算误差',
                checked: true
            }
        ];

        switch(experimentType) {
            case 'oscilloscope':
                return [
                    ...commonOptions,
                    {
                        type: 'checkbox',
                        id: 'waveform-display',
                        name: 'waveform-display',
                        value: 'waveform',
                        label: '显示波形图',
                        checked: true
                    }
                ];
            case 'mechanics':
                return [
                    ...commonOptions,
                    {
                        type: 'checkbox',
                        id: 'linear-regression',
                        name: 'linear-regression',
                        value: 'linear',
                        label: '线性回归分析',
                        checked: true
                    }
                ];
            case 'electricity':
                return [
                    ...commonOptions,
                    {
                        type: 'checkbox',
                        id: 'resistance-calculation',
                        name: 'resistance-calculation',
                        value: 'resistance',
                        label: '电阻计算',
                        checked: true
                    }
                ];
            case 'optics':
                return [
                    ...commonOptions,
                    {
                        type: 'checkbox',
                        id: 'refraction-calculation',
                        name: 'refraction-calculation',
                        value: 'refraction',
                        label: '折射率计算',
                        checked: true
                    }
                ];
            case 'thermodynamics':
                return [
                    ...commonOptions,
                    {
                        type: 'checkbox',
                        id: 'heat-capacity-calculation',
                        name: 'heat-capacity-calculation',
                        value: 'heat-capacity',
                        label: '热容计算',
                        checked: true
                    }
                ];
            default:
                return commonOptions;
        }
    }

    // 处理文件上传
    function handleFileUpload() {
        const file = dataFileInput.files[0];
        if (!file) {
            alert('请先选择文件');
            return;
        }

        if (file.name.endsWith('.xlsx')) {
            // 处理Excel文件
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    // // 检查是否在GitHub Pages环境
                    // if (window.location.host.includes('github.io')) {
                    //     alert('GitHub Pages环境可能不支持Excel文件处理，请下载到本地运行或使用CSV格式');
                    //     return;
                    // }
                    
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    
                    // 获取第一个工作表
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // 将工作表转换为JSON
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
                    
                    // 转换为文本格式
                    const textData = jsonData.map(row => row.join('\t')).join('\n');
                    dataTextArea.value = textData;
                } catch (error) {
                    alert('Excel文件处理错误: ' + error.message + 
                          '\n可能原因: GitHub Pages环境限制或文件格式不正确\n建议: 下载到本地运行或使用CSV格式');
                    console.error(error);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // 处理文本/CSV文件
            const reader = new FileReader();
            reader.onload = function(e) {
                dataTextArea.value = e.target.result;
            };
            reader.readAsText(file);
        }
    }

    // 处理数据
    function processData() {
        const rawData = dataTextArea.value.trim();
        if (!rawData) {
            alert('请输入或上传实验数据');
            return;
        }

        try {
            experimentData = parseData(rawData);
            validateData(experimentData);
            
            const processedData = performCalculations(experimentData);
            displayResults(processedData);
        } catch (error) {
            alert('数据处理错误: ' + error.message);
            console.error(error);
        }
    }

    // 解析数据
    function parseData(rawData) {
        // 健壮的CSV解析
        return rawData.split('\n')
            .filter(line => line.trim())
            .map(line => {
                // 处理各种分隔符(逗号/空格/制表符)
                const items = line.split(/[, \t]+/).filter(item => item.trim());
                // 转换为数字，过滤无效值
                const numbers = items.map(item => {
                    const num = parseFloat(item);
                    return isNaN(num) ? null : num;
                }).filter(num => num !== null);
                
                if (numbers.length < 2) {
                    throw new Error('每行至少需要2个有效数值');
                }
                return numbers;
            });
    }

    // 验证数据
    function validateData(data) {
        if (!data || data.length === 0) {
            throw new Error('无有效数据');
        }

        // 检查数据行数
        if (data.length < 3) {
            throw new Error('至少需要3组数据才能进行有效分析');
        }

        // 检查每行数据长度是否一致
        const firstRowLength = data[0].length;
        for (let i = 1; i < data.length; i++) {
            if (data[i].length !== firstRowLength) {
                throw new Error(`第${i+1}行数据长度不一致`);
            }
        }

        // 检查数据范围合理性
        data.forEach((row, index) => {
            row.forEach(value => {
                if (value === null || value === undefined) {
                    throw new Error(`第${index+1}行包含无效数据`);
                }
                if (Math.abs(value) > 1e6) {
                    throw new Error(`第${index+1}行数据值过大，请检查单位`);
                }
            });
        });
    }

    // 执行计算
    function performCalculations(data) {
        const processedData = {
            raw: data,
            results: {}
        };

        // 根据实验类型和选项执行计算
        switch(currentExperimentType) {
            case 'mechanics':
                processedData.results = calculateMechanics(data);
                break;
            case 'electricity':
                processedData.results = calculateElectricity(data);
                break;
            case 'optics':
                processedData.results = calculateOptics(data);
                break;
            case 'thermodynamics':
                processedData.results = calculateThermodynamics(data);
                break;
            case 'oscilloscope':
                processedData.results = calculateOscilloscope(data);
                break;
        }

        return processedData;
    }

    // 数字示波器计算
    function calculateOscilloscope(data) {
        const results = {};
        const options = getSelectedOptions();

        if (options.includes('waveform')) {
            // 根据fy/fx比值和φ值选择对应图片
            const waveformImages = data.map(([fy, fx, phi]) => {
                const ratio = fy / fx;
                let ratioDir;
                
                // 确定fy/fx比值目录
                if (Math.abs(ratio - 1) < 0.1) ratioDir = '1_1';
                else if (Math.abs(ratio - 0.5) < 0.1) ratioDir = '1_2';
                else if (Math.abs(ratio - 0.333) < 0.1) ratioDir = '1_3';
                else if (Math.abs(ratio - 0.666) < 0.1) ratioDir = '2_3';
                else ratioDir = '1_1'; // 默认

                // 验证相位差是否在允许的离散值范围内
                const allowedPhases = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];
                const normalizedPhi = allowedPhases.includes(phi) ? phi : 0;
                
                return {
                    fy,
                    fx,
                    phi,
                    imagePath: `Digital_Oscilloscope/${ratioDir}/${normalizedPhi}.png`
                };
            });

            results.waveforms = waveformImages;
        }

        return results;
    }

    // 力学实验计算
    function calculateMechanics(data) {
        const results = {};
        const options = getSelectedOptions();

        if (options.includes('linear')) {
            // 简单线性回归实现
            const n = data.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

            data.forEach(([x, y]) => {
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
            });

            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            results.linearRegression = {
                slope,
                intercept,
                equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
            };
        }

        return results;
    }

    // 电学实验计算
    function calculateElectricity(data) {
        const results = {};
        const options = getSelectedOptions();

        if (options.includes('resistance')) {
            // 欧姆定律计算电阻 R = V/I
            const resistances = data.map(([voltage, current]) => {
                if (current === 0) return null;
                return voltage / current;
            }).filter(r => r !== null);

            if (resistances.length > 0) {
                const avgResistance = resistances.reduce((sum, r) => sum + r, 0) / resistances.length;
                results.resistance = {
                    average: avgResistance,
                    unit: 'Ω',
                    formula: 'R = V/I'
                };
            }
        }

        return results;
    }

    // 光学实验计算
    function calculateOptics(data) {
        const results = {};
        const options = getSelectedOptions();

        if (options.includes('refraction')) {
            // 斯涅尔定律计算折射率 n = sin(入射角)/sin(折射角)
            const refractiveIndices = data.map(([incidentAngle, refractedAngle]) => {
                if (refractedAngle === 0) return null;
                const n = Math.sin(incidentAngle * Math.PI/180) / 
                          Math.sin(refractedAngle * Math.PI/180);
                return isFinite(n) ? n : null;
            }).filter(n => n !== null);

            if (refractiveIndices.length > 0) {
                const avgRefractiveIndex = refractiveIndices.reduce((sum, n) => sum + n, 0) / 
                                          refractiveIndices.length;
                results.refraction = {
                    average: avgRefractiveIndex,
                    formula: 'n = sin(θ₁)/sin(θ₂)',
                    measurements: refractiveIndices
                };
            }
        }

        return results;
    }

    // 热学实验计算
    function calculateThermodynamics(data) {
        const results = {};
        const options = getSelectedOptions();

        if (options.includes('heat-capacity')) {
            // 热容计算 C = Q/(mΔT)
            const heatCapacities = data.map(([heat, mass, tempChange]) => {
                if (mass === 0 || tempChange === 0) return null;
                return heat / (mass * tempChange);
            }).filter(c => c !== null);

            if (heatCapacities.length > 0) {
                const avgHeatCapacity = heatCapacities.reduce((sum, c) => sum + c, 0) / 
                                        heatCapacities.length;
                results.heatCapacity = {
                    average: avgHeatCapacity,
                    unit: 'J/(kg·K)',
                    formula: 'C = Q/(mΔT)',
                    measurements: heatCapacities
                };
            }
        }

        return results;
    }

    // 获取选中的处理选项
    function getSelectedOptions() {
        return Array.from(document.querySelectorAll('.processing-option input:checked'))
            .map(input => input.value);
    }

    // 显示结果
    function displayResults(processedData) {
        displayDataTable(processedData.raw);
        displayDataChart(processedData);
        displayCalculatedResults(processedData.results);
    }

    // 显示计算结果
    function displayCalculatedResults(results) {
        const resultsDiv = document.querySelector('.results-display');
        if (!resultsDiv) return;
        
        let html = '<h3>计算结果</h3>';
        
        for (const [key, value] of Object.entries(results)) {
            html += `<div class="result-item"><strong>${key}:</strong> `;
            
            if (key === 'waveforms') {
                // 特殊处理波形图显示
                html += '<div class="waveform-container" style="display: flex; flex-wrap: wrap; gap: 20px;">';
                value.forEach(waveform => {
                    html += `
                        <div class="waveform-item" style="border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0;">波形参数</h4>
                            <p style="margin: 5px 0;">fy: ${waveform.fy} Hz</p>
                            <p style="margin: 5px 0;">fx: ${waveform.fx} Hz</p>
                            <p style="margin: 5px 0;">相位差: ${waveform.phi}π</p>
                            <p style="margin: 5px 0;">fy/fx: ${(waveform.fy/waveform.fx).toFixed(2)}</p>
                            <img src="${waveform.imagePath}" 
                                 alt="波形图 fy/fx=${(waveform.fy/waveform.fx).toFixed(2)} φ=${waveform.phi}π"
                                 style="max-width: 300px; height: auto; border: 1px solid #eee;">
                        </div>
                    `;
                });
                html += '</div>';
            } else if (typeof value === 'object') {
                html += '<ul>';
                for (const [subKey, subValue] of Object.entries(value)) {
                    html += `<li>${subKey}: ${subValue}</li>`;
                }
                html += '</ul>';
            } else {
                html += value;
            }
            
            html += '</div>';
        }
        
        resultsDiv.innerHTML = html;
    }

    // 显示数据表格
    function displayDataTable(data) {
        let tableHTML = '<table><thead><tr>';
        
        // 表头
        for (let i = 0; i < data[0].length; i++) {
            tableHTML += `<th>数据${i+1}</th>`;
        }
        tableHTML += '</tr></thead><tbody>';

        // 表格内容
        data.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        dataTableDiv.innerHTML = tableHTML;
    }

    // 显示数据图表
    function displayDataChart(processedData) {
        if (!processedData.raw || processedData.raw.length === 0) {
            console.error('无有效数据可用于绘制图表');
            return;
        }

        if (resultChart) {
            resultChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        if (!ctx) {
            console.error('无法获取canvas上下文');
            return;
        }
        
        console.log('原始数据:', processedData.raw);
        
        try {
            // 绘制原始数据散点图
            const labels = processedData.raw.map((_, i) => `数据点 ${i+1}`);
            const dataset = {
                label: '实验数据',
                data: processedData.raw.map(row => row[1]), // 假设y值在第二列
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            };

            // 如果有线性回归结果，添加趋势线
            const datasets = [dataset];
            if (processedData.results.linearRegression) {
                const { slope, intercept } = processedData.results.linearRegression;
                datasets.push({
                    label: '线性回归',
                    data: processedData.raw.map(row => slope * row[0] + intercept),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    fill: false,
                    type: 'line'
                });
            }

            // 按x值排序数据
            const sortedData = [...processedData.raw].sort((a, b) => a[0] - b[0]);
            
            resultChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sortedData.map((_, i) => `数据点 ${i+1}`),
                    datasets: [
                        {
                            label: '实验数据',
                            data: sortedData.map(row => ({x: row[0], y: row[1]})),
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            showLine: true
                        },
                        ...(processedData.results.linearRegression ? [{
                            label: '线性回归',
                            data: sortedData.map(row => ({
                                x: row[0],
                                y: processedData.results.linearRegression.slope * row[0] + 
                                    processedData.results.linearRegression.intercept
                            })),
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 3,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }] : [])
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: 'X轴'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Y轴'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('图表创建错误:', error);
            alert('图表创建失败: ' + error.message);
        }
    }

    // 清除结果
    function clearResults() {
        dataTableDiv.innerHTML = '';
        if (resultChart) {
            resultChart.destroy();
            resultChart = null;
        }
    }
});
