const path = require("path")

const getName = function (attrs) {
    const name = attrs.name
    return typeof name === 'string' ? name : 'default'
}

const getColumns = function (attrs) {
    const columns = attrs.columns
    return typeof columns === 'string' ? columns : '3'
}

const generateGrid = (data, self, parent, attrs) => {
    const columns = getColumns(attrs);
    const name = `grid-${getName(attrs)}`;
    const styles = `
    <style>
      .${name}-grid {
        display: grid;
        grid-template-columns: repeat(${columns}, 1fr);
        grid-gap: 16px;
        margin-top: 16px;
      }

      .${name}-item {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        margin-bottom: 16px;
        background: #f3f2f2;
        width: 100%;
        min-height: 150px;
        max-height: 150px;
        padding: 0px;
      }

      @media screen and (max-width: 769px) {
        .${name}-grid {
          grid-template-columns: repeat(1, 1fr);
        }
      }

      @media screen and (min-width: 780px) and (max-width: 1279px) {
        .${name}-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media screen and (min-width: 1280px) {
        .${name}-grid {
          grid-template-columns: repeat(${columns}, 1fr);
        }
      }

      .${name}-item > div {
        padding: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-shadow: 0px 0px 8px black;
        color: #FFF;
        padding: 16px;
      }

      .no-image {
        text-shadow: none;
        color: #000;
      }

      .${name}-item > img {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        object-fit: cover;
        object-position: center;
      }
    </style>
  `;

    const elements = data.map((ele) => {
        const image = ele.img ? `<img src="_images/${ele.img}" />` : null;

        return `
      <div class="${name}-item">
        <div>
          <div class="grid-item-title ${!image || image === "" ? "no-image" : ""}">
            <a href="${ele.to}">${ele.title}</a>
          </div>
          <div class="grid-item-description ${!image || image === "" ? "no-image" : ""}">${ele.subtitle}</div>
        </div>
        ${image ? image : ""}
      </div>
    `;
    });
    const html = `
    ${styles}
    <div id="${name}" class="${name}-grid">
      ${elements.join("")}
    </div>
  `

    return html;
}

const GridBlockMacro = function () {
    const self = this

    self.named('grid')
    self.positionalAttributes(['columns', 'name'])

    self.process((parent, target, attrs) => {
        const filePath = path.resolve("src", parent.getDocument().getBaseDir(), target);
        const fileContent = parent.readAsset(filePath, { warn_on_failure: true, normalize: true })
        if (typeof fileContent === 'string') {
            const block = self.createBlock(parent, 'pass', fileContent);
            const blockString = block.applySubstitutions(block.convert(), ["callouts", "quotes", "attributes", "replacements", "macros", "post_replacements"]);
            const jsonData = JSON.parse(blockString)
            const html = generateGrid(jsonData, self, parent, attrs)
            return self.createBlock(parent, 'pass', html, attrs, {})
        }
        return self.createBlock(parent, 'pass', `<div class="openblock">[file does not exist or cannot be read: ${target}]</div>`, attrs, {})
    })
}

const GridBlock = function () {
    const self = this

    self.named('grid')
    self.positionalAttributes(['columns', 'name'])
    self.onContext('paragraph')

    self.process((parent, reader, attrs) => {
        var lines = reader.getLines()
        try {
            const block = self.createBlock(parent, 'pass', lines);
            const blockString = block.applySubstitutions(block.convert(), ["callouts", "quotes", "attributes", "replacements", "macros", "post_replacements"]);
            const jsonData = JSON.parse(blockString);
            const html = generateGrid(jsonData, self, parent, attrs)
            return self.createBlock(parent, 'pass', html, attrs, {})
        } catch (ex) {
            console.log(ex);
        }
        return self.createBlock(parent, 'pass', `<div class="openblock">[an error has ocurred, check your JSON format.]</div>`, attrs, {})
    })
}

module.exports = (registry) => {
    registry.preprocessor(function () {
        var self = this
        self.process(function (doc) {
            const pageVersion = doc.getOptions().attributes['$$smap']['page-component-version']
            const latestVersion = doc.getOptions().attributes['$$smap']['page-latest-version']
            const latestSegmentVersion = doc.getOptions().attributes['$$smap']['page-latest-segment-version']
            doc.removeAttribute('page-component-display-version')
            if (pageVersion === latestVersion) {
                doc.setAttribute('page-component-display-version', latestSegmentVersion);
                doc.setAttribute('page-url-version', latestSegmentVersion);
            } else {
                doc.setAttribute('page-component-display-version', pageVersion);
                doc.setAttribute('page-url-version', pageVersion);
            }
        });
    });
    if (typeof registry.register === 'function') {
        registry.register(() => {
            this.blockMacro(GridBlockMacro)
            this.block(GridBlock)
        })
    } else if (typeof registry.block === 'function') {
        registry.blockMacro(GridBlockMacro)
        registry.block(GridBlock)
    }
    return registry;
}